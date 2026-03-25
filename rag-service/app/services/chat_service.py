from __future__ import annotations

import os
import logging
import re
from typing import Any

from app.rag.embeddings import EmbeddingModel
from app.rag.pdf_processor import load_and_split_pdf
from app.rag.chroma_store import upsert_report_chunks, query_report_chunks
from app.services.groq_client import groq_chat_completion
from app.services.prompting import detect_intent, build_question_with_history, build_strict_prompt, ensure_response


_embedding_model: EmbeddingModel | None = None
logger = logging.getLogger(__name__)


def get_embedding_model() -> EmbeddingModel:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = EmbeddingModel("all-MiniLM-L6-v2")
    return _embedding_model


def warmup_rag() -> None:
    # Force model + tokenizer + runtime initialization.
    model = get_embedding_model()
    _ = model.embed_query("warmup")

    # Initialize Chroma collection (best-effort)
    try:
        from app.rag.chroma_store import get_chroma_collection

        _ = get_chroma_collection()
    except Exception:
        pass


def index_pdf_for_screening(*, screening_id: str, pdf_path: str) -> dict[str, Any]:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    chunks = load_and_split_pdf(pdf_path, chunk_size=500, chunk_overlap=100)
    texts = [t for (t, _) in chunks]
    metadatas: list[dict[str, Any]] = []
    for (_, md) in chunks:
        md2 = dict(md or {})
        md2["screening_id"] = screening_id
        metadatas.append(md2)

    if not texts:
        return {"screening_id": screening_id, "chunks_indexed": 0}

    model = get_embedding_model()
    embeddings = model.embed_texts(texts)

    ids = [f"{screening_id}:{i}" for i in range(len(texts))]

    count = upsert_report_chunks(
        screening_id=screening_id,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )

    return {"screening_id": screening_id, "chunks_indexed": count}


def retrieve_context(*, screening_id: str, question: str, n_results: int = 4) -> tuple[str, list[str]]:
    model = get_embedding_model()
    q_emb = model.embed_query(question)
    result = query_report_chunks(screening_id=screening_id, query_embedding=q_emb, n_results=n_results)

    docs = (result.get("documents") or [[]])[0] or []
    distances = (result.get("distances") or [[]])[0] or []

    # Chroma cosine distance: lower is closer. Treat very high distance as irrelevant.
    # For generic "summarize the report" questions, we relax this threshold later.
    filtered: list[str] = []
    for doc, dist in zip(docs, distances):
        if not doc:
            continue

        d = str(doc).strip()
        if not d:
            continue

        # Drop common header/footer-only chunks that often dominate semantic matches.
        if re.search(r"(?im)^\s*page\s+\d+\s+of\s+\d+\b", d) and len(d) < 140:
            continue
        if re.search(r"(?i)\bconfidential\b", d) and len(d) < 200:
            continue

        if dist is None or dist <= 0.6:
            filtered.append(d)

    # Keep prompt small; do NOT send entire PDF.
    max_chars = 2500
    context_parts: list[str] = []
    used = 0
    for chunk in filtered:
        c = chunk.strip()
        if not c:
            continue
        if used + len(c) + 2 > max_chars:
            remaining = max_chars - used
            if remaining > 200:
                context_parts.append(c[:remaining])
            break
        context_parts.append(c)
        used += len(c) + 2

    retrieved_context = "\n\n".join(context_parts).strip()
    return retrieved_context, filtered


def retrieve_context_relaxed(*, screening_id: str, question: str, n_results: int = 8) -> tuple[str, list[str]]:
    """Retrieve chunks for generic report summary questions.

    We still use semantic query, but we do NOT drop chunks based on a strict distance threshold.
    This prevents false "no report context" when the user asks a very generic question.
    """
    model = get_embedding_model()

    # Use a canonical query so we match substantive "findings" sections rather than PDF footers.
    canonical = (
        "report summary key findings results indicators interpretation recommendations next steps"
    )
    q_emb = model.embed_query(canonical)
    result = query_report_chunks(screening_id=screening_id, query_embedding=q_emb, n_results=n_results)

    docs = (result.get("documents") or [[]])[0] or []
    # Keep non-empty docs only and drop footer/header-only chunks.
    filtered: list[str] = []
    for doc in docs:
        if not doc:
            continue
        d = str(doc).strip()
        if not d:
            continue
        if re.search(r"(?im)^\s*page\s+\d+\s+of\s+\d+\b", d) and len(d) < 140:
            continue
        if re.search(r"(?i)\bconfidential\b", d) and len(d) < 200:
            continue
        filtered.append(d)

    max_chars = 2500
    context_parts: list[str] = []
    used = 0
    for chunk in filtered:
        c = chunk.strip()
        if not c:
            continue
        if used + len(c) + 2 > max_chars:
            remaining = max_chars - used
            if remaining > 200:
                context_parts.append(c[:remaining])
            break
        context_parts.append(c)
        used += len(c) + 2

    retrieved_context = "\n\n".join(context_parts).strip()
    return retrieved_context, filtered


def answer_question(*, screening_id: str, system_data: dict[str, Any], question: str, history: list[dict[str, Any]], n_results: int) -> dict[str, Any]:
    question_with_history = build_question_with_history(question, history, max_messages=5)

    intent = detect_intent(question)

    retrieved_context, chunks = retrieve_context(screening_id=screening_id, question=question, n_results=n_results)
    has_report_context = bool(chunks)

    asked_about_report = bool(re.search(r"\b(report|uploaded|pdf|document)\b", question, flags=re.IGNORECASE))
    is_generic_report_summary = bool(
        re.search(
            r"\b(what\s+does\s+.*report\s+say|summari[sz]e|summary|overall\s+findings|key\s+findings)\b",
            question,
            flags=re.IGNORECASE,
        )
    )

    # If the report is indexed but strict semantic filtering returned nothing, try a relaxed retrieval
    # for generic summary questions.
    if asked_about_report and (not has_report_context) and is_generic_report_summary:
        retrieved_context, chunks = retrieve_context_relaxed(
            screening_id=screening_id,
            question=question,
            n_results=max(n_results, 8),
        )
        has_report_context = bool(chunks)

    if asked_about_report and not has_report_context:
        # Be explicit: do not imply we read a report when we did not retrieve any report chunks.
        if intent in {"explanation", "interpretation", "recommendation"}:
            answer = (
                "Explanation:\n"
                "I can't access any uploaded report content for this question (it may not be uploaded or indexed yet).\n\n"
                "What it means:\n"
                "I can still explain the screening indicators from System Data, but I cannot quote or summarize the report without report context.\n\n"
                "Recommended actions:\n"
                "- Upload the PDF report in the chat page (Upload Medical Report).\n"
                "- Wait for indexing to finish, then ask again.\n"
                "- If you already uploaded it, re-upload and try again."
            )
        else:
            answer = "I can't access any uploaded report content right now (it may not be uploaded or indexed yet)."

        return {
            "answer": answer,
            "used_report_context": False,
            "retrieved_chunks": [],
        }

    # If no relevant chunks, answer only from system_data by sending empty context.
    prompt = build_strict_prompt(
        system_data=system_data,
        retrieved_context=retrieved_context if retrieved_context else "",
        question=question_with_history,
        intent=intent,
        has_report_context=has_report_context,
    )

    try:
        raw = groq_chat_completion(prompt=prompt)
        answer = ensure_response(raw, intent)
    except Exception as e:
        # Do not fail the whole request if Groq is unavailable.
        msg = str(e) or e.__class__.__name__
        if "GROQ_API_KEY" in msg:
            logger.warning("Groq is not configured (missing GROQ_API_KEY); returning fallback answer")
        else:
            logger.warning("Groq call failed; returning fallback answer: %s", msg)
        answer = ensure_response("Information not available", intent)

    # Normalize formatting for professional weekly plans.
    if intent == "recommendation":
        # Ensure time-block bullets start on their own lines (even if the model
        # accidentally outputs them inline separated by spaces).
        answer = re.sub(r"\s+-\s*Morning\b", "\n- Morning", answer)
        answer = re.sub(r"\s+-\s*Afternoon\b", "\n- Afternoon", answer)
        answer = re.sub(r"\s+-\s*Evening\b", "\n- Evening", answer)

        # Ensure day headers start on a new paragraph.
        for day in ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
            answer = re.sub(rf"\n{day}\b", rf"\n\n{day}", answer)
            answer = re.sub(rf"\s+{day}\b", rf"\n\n{day}", answer)

        # Collapse 3+ blank lines down to 2.
        answer = re.sub(r"\n{3,}", "\n\n", answer).strip()

    # If we did not retrieve any report context, strip misleading report claims.
    # Do not apply this to app guidance (it can corrupt UI labels like "PDF").
    if (not has_report_context) and intent != "app_guidance":
        answer = re.sub(r"(?im)^\s*(the\s+)?(uploaded\s+)?report\b.*$", "", answer).strip() or answer
        # Only rewrite report-attribution phrases, not generic file-type words.
        answer = re.sub(r"(?i)\b(uploaded\s+report|the\s+report|the\s+pdf)\b", "the available screening data", answer)

    return {
        "answer": answer,
        "used_report_context": has_report_context,
        "retrieved_chunks": chunks[: n_results],
    }

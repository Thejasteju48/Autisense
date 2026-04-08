from __future__ import annotations

import os
from typing import Any

import chromadb
from chromadb.config import Settings


def get_chroma_collection():
    chroma_path = os.environ.get("RAG_CHROMA_PATH", "./chroma_db")
    collection_name = os.environ.get("RAG_COLLECTION_NAME", "medical_reports")

    client = chromadb.PersistentClient(
        path=chroma_path,
        settings=Settings(anonymized_telemetry=False),
    )

    # cosine works well with normalized sentence-transformers embeddings
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )
    return collection


def get_all_indexed_content(*, screening_id: str) -> str:
    """Retrieve all indexed chunks for a screening ID and combine into full report text."""
    collection = get_chroma_collection()
    
    # Get all documents for this screening
    results = collection.get(
        where={"screening_id": screening_id},
        include=["documents"],
    )

    documents = results.get("documents", []) or []
    ids = results.get("ids", []) or []
    
    if not documents:
        return ""

    # Combine chunks in a stable order by numeric suffix in id (screening_id:chunk_index).
    pairs = list(zip(ids, documents)) if ids else [("", d) for d in documents]

    def _chunk_order(item: tuple[str, str]) -> int:
        chunk_id, _ = item
        try:
            return int(str(chunk_id).rsplit(":", 1)[-1])
        except Exception:
            return 0

    pairs.sort(key=_chunk_order)

    return "\n\n".join([str(doc).strip() for _, doc in pairs if str(doc).strip()])


def upsert_report_chunks(
    *,
    screening_id: str,
    documents: list[str],
    embeddings: list[list[float]],
    metadatas: list[dict[str, Any]],
    ids: list[str],
) -> int:
    collection = get_chroma_collection()

    # Re-indexing same screening id should replace prior chunks.
    try:
        collection.delete(where={"screening_id": screening_id})
    except Exception:
        # If delete fails (older Chroma versions), we still attempt add.
        pass

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    return len(ids)


def query_report_chunks(
    *,
    screening_id: str,
    query_embedding: list[float],
    n_results: int,
) -> dict[str, Any]:
    collection = get_chroma_collection()
    return collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where={"screening_id": screening_id},
        include=["documents", "metadatas", "distances"],
    )

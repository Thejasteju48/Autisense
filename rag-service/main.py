from __future__ import annotations

import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import IndexFromPathRequest, ChatRequest, ChatResponse
from app.services.chat_service import index_pdf_for_screening, answer_question, warmup_rag

DOTENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=DOTENV_PATH, override=True)

logger = logging.getLogger("rag-service")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Surface config issues early (avoid silent 'Information not available' responses).
    groq_len = len((os.environ.get("GROQ_API_KEY") or "").strip())
    if groq_len <= 0:
        logger.warning("GROQ_API_KEY is not set; Groq answers will be disabled (fallback responses only)")
    else:
        logger.info("GROQ_API_KEY detected (len=%s)", groq_len)
    # Warm up embedding model + Chroma client so the first user request doesn't time out.
    try:
        warmup_rag()
    except Exception:
        pass
    yield

app = FastAPI(
    title="RAG Chatbot Service",
    description="High-accuracy RAG-based autism screening assistant (ChromaDB + MiniLM + Groq)",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = (os.environ.get("RAG_ALLOWED_ORIGINS") or "").split(",")
allowed_origins = [o.strip() for o in allowed_origins if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "RAG Chatbot Service",
        "status": "running",
        "endpoints": ["/rag/index", "/rag/index-upload", "/chat"],
    }


@app.get("/health")
def health():
    # Refresh env from disk for accurate debugging.
    load_dotenv(dotenv_path=DOTENV_PATH, override=True)
    groq_len = len((os.environ.get("GROQ_API_KEY") or "").strip())
    return {
        "service": "RAG Chatbot Service",
        "status": "ok",
        "dotenv_path": str(DOTENV_PATH),
        "dotenv_exists": DOTENV_PATH.exists(),
        "groq_configured": groq_len > 0,
        "groq_key_len": groq_len,
        "chroma_path": os.environ.get("RAG_CHROMA_PATH", "./chroma_db"),
        "collection": os.environ.get("RAG_COLLECTION_NAME", "medical_reports"),
    }


@app.post("/rag/index")
def rag_index(req: IndexFromPathRequest):
    try:
        result = index_pdf_for_screening(screening_id=req.screening_id, pdf_path=req.pdf_path)
        return {"success": True, "data": result}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rag/index-upload")
async def rag_index_upload(screening_id: str, reportFile: UploadFile = File(...)):
    try:
        if reportFile.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="PDF file is required")

        upload_dir = os.path.join(os.path.dirname(__file__), "uploads", "medical-reports")
        os.makedirs(upload_dir, exist_ok=True)

        filename = reportFile.filename or f"{screening_id}.pdf"
        safe_name = filename.replace("..", "").replace("/", "_").replace("\\", "_")
        pdf_path = os.path.join(upload_dir, f"{screening_id}__{safe_name}")

        content = await reportFile.read()
        with open(pdf_path, "wb") as f:
            f.write(content)

        result = index_pdf_for_screening(screening_id=screening_id, pdf_path=pdf_path)
        return {"success": True, "data": {**result, "pdf_path": pdf_path}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        def _dump_msg(m):
            # Support both Pydantic v1 and v2
            if hasattr(m, "model_dump"):
                return m.model_dump()
            return m.dict()

        data = answer_question(
            screening_id=req.screening_id,
            system_data=req.system_data,
            question=req.question,
            history=[_dump_msg(m) for m in req.history],
            n_results=req.n_results,
        )
        return ChatResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.exception_handler(Exception)
def generic_error_handler(_, exc: Exception):
    return JSONResponse(status_code=500, content={"success": False, "message": "Internal server error", "error": str(exc)})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)

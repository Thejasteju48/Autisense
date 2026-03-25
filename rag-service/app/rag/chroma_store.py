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

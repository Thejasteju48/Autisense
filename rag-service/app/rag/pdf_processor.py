from __future__ import annotations

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter


def load_and_split_pdf(pdf_path: str, *, chunk_size: int = 500, chunk_overlap: int = 100) -> list[tuple[str, dict]]:
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(docs)

    out: list[tuple[str, dict]] = []
    for d in chunks:
        text = (d.page_content or "").strip()
        if not text:
            continue
        metadata = dict(d.metadata or {})
        out.append((text, metadata))

    return out

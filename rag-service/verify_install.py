"""Quick install verification for the Python 3.10 RAG environment.

Run:
  python rag-service/verify_install.py

Expected:
  - chromadb imports
  - persistent client + collection creation works
"""

import os


def main() -> None:
    import chromadb

    chroma_path = os.environ.get("RAG_CHROMA_PATH", "./chroma_db")
    collection_name = os.environ.get("RAG_COLLECTION_NAME", "verify_collection")

    client = chromadb.PersistentClient(path=chroma_path)
    collection = client.get_or_create_collection(name=collection_name)

    collection.add(
        ids=["test-1"],
        documents=["This is a test document for installation verification."],
        metadatas=[{"source": "verify_install"}],
    )

    result = collection.query(query_texts=["test"], n_results=1)

    print("SUCCESS: chromadb is working")
    print(f"Chroma path: {chroma_path}")
    print(f"Collection: {collection_name}")
    print(f"Query result keys: {list(result.keys())}")


if __name__ == "__main__":
    main()

"""Retriever helpers."""

from __future__ import annotations

from rag_support_assistant.config import TOP_K
from rag_support_assistant.vector_store import LocalVectorStore


def retrieve_context(query: str, store: LocalVectorStore, top_k: int = TOP_K) -> tuple[list[str], float]:
    """Fetch relevant chunks for a user query."""
    results = store.similarity_search(query, top_k=top_k)
    chunks = [result.chunk for result in results]
    confidence = results[0].score if results else 0.0
    return chunks, confidence

"""Vector database helpers."""

from __future__ import annotations

from dataclasses import dataclass

from rag_support_assistant.embeddings import cosine_similarity, embed_text


@dataclass
class SearchResult:
    chunk: str
    score: float


class LocalVectorStore:
    """A lightweight in-memory vector store for local demos."""

    def __init__(self, chunks: list[str]) -> None:
        self.records = [{"chunk": chunk, "embedding": embed_text(chunk)} for chunk in chunks]

    def similarity_search(self, query: str, top_k: int = 3) -> list[SearchResult]:
        query_embedding = embed_text(query)
        scored = [
            SearchResult(chunk=record["chunk"], score=cosine_similarity(query_embedding, record["embedding"]))
            for record in self.records
        ]
        scored.sort(key=lambda item: item.score, reverse=True)
        return [item for item in scored[:top_k] if item.score > 0]


def build_vector_store(chunks: list[str]) -> LocalVectorStore:
    """Store embeddings in a local vector store."""
    return LocalVectorStore(chunks)

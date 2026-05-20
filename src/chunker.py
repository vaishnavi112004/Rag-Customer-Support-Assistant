"""Text chunking helpers."""

from __future__ import annotations

from rag_support_assistant.config import CHUNK_OVERLAP, CHUNK_SIZE


def chunk_text(text: str) -> list[str]:
    """Split text into retrieval-friendly chunks."""
    normalized = " ".join(text.split())
    if not normalized:
        return []

    chunks: list[str] = []
    start = 0
    text_length = len(normalized)

    while start < text_length:
        end = min(start + CHUNK_SIZE, text_length)
        chunk = normalized[start:end]

        if end < text_length:
            last_space = chunk.rfind(" ")
            if last_space > CHUNK_SIZE // 2:
                end = start + last_space
                chunk = normalized[start:end]

        chunks.append(chunk.strip())
        if end >= text_length:
            break
        start = max(end - CHUNK_OVERLAP, 0)

    return [chunk for chunk in chunks if chunk]

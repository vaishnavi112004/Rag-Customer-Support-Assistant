"""Embedding helpers."""

from __future__ import annotations

import math
import re
from collections import Counter


TOKEN_PATTERN = re.compile(r"[a-zA-Z0-9]+")


def tokenize(text: str) -> list[str]:
    """Convert text into lowercase tokens."""
    return TOKEN_PATTERN.findall(text.lower())


def embed_text(text: str) -> Counter[str]:
    """Create a lightweight local embedding representation."""
    return Counter(tokenize(text))


def cosine_similarity(vector_a: Counter[str], vector_b: Counter[str]) -> float:
    """Compute cosine similarity for sparse token counters."""
    if not vector_a or not vector_b:
        return 0.0

    intersection = set(vector_a).intersection(vector_b)
    numerator = sum(vector_a[token] * vector_b[token] for token in intersection)
    magnitude_a = math.sqrt(sum(value * value for value in vector_a.values()))
    magnitude_b = math.sqrt(sum(value * value for value in vector_b.values()))
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0
    return numerator / (magnitude_a * magnitude_b)


def get_embedding_model():
    """Return the embedding model interface used by the local demo."""
    return embed_text

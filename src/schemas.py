"""Core data structures for the workflow."""

from typing import List, TypedDict


class GraphState(TypedDict, total=False):
    query: str
    intent: str
    retrieved_chunks: List[str]
    answer: str
    confidence: float
    escalate: bool
    human_response: str

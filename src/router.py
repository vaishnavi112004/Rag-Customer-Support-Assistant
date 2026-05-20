"""Routing helpers for answer vs escalation."""

from rag_support_assistant.config import ESCALATION_KEYWORDS


def should_escalate(query: str, chunks: list[str], confidence: float) -> bool:
    """Decide whether the query should go to HITL."""
    if not chunks:
        return True
    if confidence < 0.18:
        return True
    if any(word in query.lower() for word in ESCALATION_KEYWORDS):
        return True
    return False

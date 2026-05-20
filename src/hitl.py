"""Human-in-the-loop escalation helpers."""

from __future__ import annotations


def escalate_to_human(state: dict) -> dict:
    """Prepare an escalation payload for a human agent."""
    state["human_response"] = (
        "Escalated to human support. Reason: low confidence, missing context, "
        "or sensitive customer issue."
    )
    return state

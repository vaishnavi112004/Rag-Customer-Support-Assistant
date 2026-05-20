"""LangGraph workflow definition."""

from __future__ import annotations

from typing import Callable

from rag_support_assistant.hitl import escalate_to_human
from rag_support_assistant.retriever import retrieve_context
from rag_support_assistant.router import should_escalate
from rag_support_assistant.schemas import GraphState
from rag_support_assistant.vector_store import LocalVectorStore


def _build_answer(query: str, chunks: list[str]) -> str:
    """Create a concise answer from retrieved chunks."""
    if not chunks:
        return "I could not find relevant information in the knowledge base."

    primary_context = chunks[0]
    return (
        f"Based on the knowledge base, here is the answer for '{query}':\n"
        f"{primary_context}"
    )


def process_query(state: GraphState, store: LocalVectorStore) -> GraphState:
    """Process the query and prepare the response state."""
    query = state["query"]
    chunks, confidence = retrieve_context(query, store)
    escalate = should_escalate(query, chunks, confidence)

    updated_state: GraphState = {
        **state,
        "retrieved_chunks": chunks,
        "confidence": confidence,
        "escalate": escalate,
        "intent": "escalate" if escalate else "answer",
        "answer": _build_answer(query, chunks),
    }

    if escalate:
        return escalate_to_human(updated_state)
    return updated_state


class SimpleGraphRunner:
    """Fallback runner when LangGraph is not installed."""

    def __init__(self, store: LocalVectorStore) -> None:
        self.store = store

    def invoke(self, state: GraphState) -> GraphState:
        return process_query(state, self.store)


def build_graph(store: LocalVectorStore):
    """Create the LangGraph workflow, with a local fallback."""
    try:
        from langgraph.graph import END, START, StateGraph  # type: ignore

        workflow = StateGraph(GraphState)
        workflow.add_node("process", lambda state: process_query(state, store))
        workflow.add_node("output", lambda state: state)
        workflow.add_edge(START, "process")
        workflow.add_edge("process", "output")
        workflow.add_edge("output", END)
        return workflow.compile()
    except Exception:
        return SimpleGraphRunner(store)

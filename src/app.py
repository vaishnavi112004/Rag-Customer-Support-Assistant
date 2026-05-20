"""Entry point for the RAG support assistant."""

from __future__ import annotations

from rag_support_assistant.chunker import chunk_text
from rag_support_assistant.config import PDF_PATH
from rag_support_assistant.graph import build_graph
from rag_support_assistant.loader import load_pdf
from rag_support_assistant.vector_store import build_vector_store


def bootstrap():
    """Load the knowledge base and initialize the workflow."""
    text = load_pdf(str(PDF_PATH))
    chunks = chunk_text(text)
    store = build_vector_store(chunks)
    graph = build_graph(store)
    return graph, len(chunks)


def main() -> None:
    """Run the local CLI application."""
    graph, chunk_count = bootstrap()
    print("RAG support assistant is ready.")
    print(f"Knowledge base loaded from: {PDF_PATH}")
    print(f"Chunks indexed: {chunk_count}")
    print("Type your question. Type 'exit' to stop.")

    while True:
        query = input("\nYou: ").strip()
        if not query:
            continue
        if query.lower() in {"exit", "quit"}:
            print("Session closed.")
            break

        result = graph.invoke({"query": query})
        print(f"\nIntent: {result.get('intent', 'unknown')}")
        print(f"Confidence: {result.get('confidence', 0.0):.2f}")
        print(f"Answer: {result.get('answer', 'No answer generated.')}")
        if result.get("escalate"):
            print(f"HITL: {result.get('human_response', 'Escalation triggered.')}")


if __name__ == "__main__":
    main()

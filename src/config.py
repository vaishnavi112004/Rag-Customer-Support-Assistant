"""Configuration values for the RAG assistant."""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
PDF_PATH = DATA_DIR / "knowledge_base.pdf"
COLLECTION_NAME = "customer_support_kb"
CHUNK_SIZE = 450
CHUNK_OVERLAP = 80
TOP_K = 3
ESCALATION_KEYWORDS = {"refund", "legal", "complaint", "urgent", "fraud", "hack", "compromise"}

"""PDF loading helpers."""

from __future__ import annotations

import re
from pathlib import Path


def _extract_text_from_raw_pdf(raw_text: str) -> str:
    """Extract plain text from a simple PDF content stream."""
    matches = re.findall(r"\((.*?)\)\s*Tj", raw_text, flags=re.DOTALL)
    cleaned = [match.replace("\\(", "(").replace("\\)", ")").replace("\\n", " ").strip() for match in matches]
    return "\n".join(line for line in cleaned if line)


def load_pdf(path: str) -> str:
    """Load the source PDF and return extracted text."""
    pdf_path = Path(path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"Knowledge base PDF not found at: {pdf_path}")

    try:
        from pypdf import PdfReader  # type: ignore

        reader = PdfReader(str(pdf_path))
        text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()
        if text:
            return text
    except Exception:
        pass

    raw_text = pdf_path.read_text(encoding="latin-1", errors="ignore")
    text = _extract_text_from_raw_pdf(raw_text).strip()
    if not text:
        raise ValueError("Could not extract text from the PDF.")
    return text

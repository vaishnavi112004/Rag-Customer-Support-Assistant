# RAG Internship Project
# RAG-Based Customer Support Assistant

A localhost web application for a customer-support use case built around the core ideas of **Retrieval-Augmented Generation (RAG)**, **workflow-based routing**, and **Human-in-the-Loop (HITL) escalation**.

This project demonstrates how a support assistant can:
- accept a PDF knowledge base
- extract and chunk document content
- retrieve relevant context for user queries
- generate grounded responses
- route sensitive or low-confidence queries for human escalation

## Project Overview

The system is designed for a customer-support scenario where answers should come from a knowledge base instead of from generic model memory.

The application includes:
- a localhost web UI
- PDF upload support
- document text extraction
- chunk-based retrieval
- intent-based routing
- confidence display
- HITL escalation handling

## Project Goal
Build a RAG-based customer support assistant that:
- loads a PDF knowledge base
- chunks and embeds the content
- stores vectors in ChromaDB
- answers user queries using retrieved context
- uses LangGraph for workflow orchestration
- supports Human-in-the-Loop escalation
## Key Concepts Covered

## Final Project Structure
- **RAG:** retrieve document context before answering
- **Chunking:** split large PDF text into smaller searchable units
- **Retrieval:** find the most relevant chunks for a query
- **Routing:** decide whether to answer directly or escalate
- **HITL:** hand off complex or risky queries to human support
- **Workflow Thinking:** structure the system as a controlled query-processing pipeline

## Current Implementation Note

This repository includes a **working localhost demo** focused on the project flow and presentation.  
For the demo, retrieval is implemented with a lightweight local similarity approach so the project can run easily in a local environment.

Conceptually, the design aligns with:
- PDF ingestion
- chunking
- embeddings / retrieval flow
- vector-search style processing
- LangGraph-style workflow orchestration
- Human-in-the-Loop escalation

If needed, this can be extended further with production integrations such as:
- ChromaDB
- real embedding models
- OpenAI or Hugging Face models
- full LangGraph execution

## Features

- Clean localhost UI for demo and presentation
- Upload your own PDF knowledge base
- Automatically switch to the uploaded document
- Ask customer-support questions in chat format
- View response intent and confidence score
- Display retrieved context chunks
- Trigger escalation for sensitive or low-confidence queries

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js
- **Document Handling:** PDF text extraction
- **Python Modules:** kept for modular RAG architecture and design mapping
- **Design Scope:** RAG, routing, HITL, workflow-based customer support assistant

## Project Structure

```text
New project/
RAG_INTERNSHIP_PROJECT/
|-- data/
|   |-- knowledge_base.pdf
|   |-- uploads/
|-- docs/
|   |-- HLD.md
|   |-- LLD.md
|   |-- Technical_Documentation.md
|-- public/
|   |-- index.html
|   |-- styles.css
|   |-- app.js
|-- src/
|   |-- rag_support_assistant/
|   |   |-- __init__.py
|   |   |-- app.py
|   |   |-- chunker.py
|   |   |-- config.py
|   |   |-- schemas.py
|   |   |-- embeddings.py
|   |   |-- graph.py
|   |   |-- hitl.py
|   |   |-- loader.py
|   |   |-- chunker.py
|   |   |-- embeddings.py
|   |   |-- vector_store.py
|   |   |-- prompts.py
|   |   |-- retriever.py
|   |   |-- router.py
|   |   |-- hitl.py
|   |   |-- graph.py
|   |   |-- prompts.py
|   |   |-- app.py
|   |   |-- schemas.py
|   |   |-- vector_store.py
|-- tests/
|   |-- test_smoke.py
|-- package.json
|-- requirements.txt
|-- .env.example
|-- run_app.py
|-- run_project.bat
|-- server.js
|-- README.md
```

## Module Summary

- `public/`: localhost web interface
- `server.js`: main Node.js server and API routes
- `data/knowledge_base.pdf`: default support PDF
- `data/uploads/`: uploaded PDFs stored locally
- `src/rag_support_assistant/`: modular Python structure for RAG design mapping
- `docs/`: HLD, LLD, and technical documentation
- `run_project.bat`: one-click local launcher

## How the System Works

1. The application loads a default PDF knowledge base.
2. The user can upload another PDF from the UI.
3. The system extracts text and prepares chunks.
4. When the user asks a question, the system retrieves the most relevant chunks.
5. It generates an answer from the retrieved context.
6. If the query is sensitive, unclear, or low-confidence, the system escalates it to human support.

## Query Routing Logic

The assistant escalates when:
- no useful context is found
- confidence is too low
- the query contains sensitive or escalation-worthy intent
- the case appears urgent or complex

Examples of escalation-oriented queries:
- refund disputes
- legal complaints
- account compromise
- urgent complaints

## Quick Run

Open PowerShell or the VS Code terminal in the project folder and run:

```powershell
cd "J:\RAG_INTERNSHIP_PROJECT"
node server.js
```

Then open:

```text
http://localhost:3000
```

To stop the server:

```powershell
Ctrl + C
```

You can also run:

```powershell
.\run_project.bat
```

## Demo Flow

1. Start the localhost server.
2. Open the app in the browser.
3. Upload a support knowledge-base PDF.
4. Ask normal support questions.
5. Test an escalation query.
6. Show confidence, intent, and retrieved context in the UI.

## Suggested Demo Queries

- `How do I reset my password?`
- `How can I track my order?`
- `When will my refund arrive?`
- `I have an urgent legal complaint`

## PDF Upload Guidance

Use a customer-support style PDF containing topics such as:
- password reset
- order tracking
- refund policy
- cancellation policy
- subscription support
- contact support
- escalation instructions

The default file path is:

```text
data/knowledge_base.pdf
```

## Submission Mapping
- `docs/HLD.md`: High-Level Design
- `docs/LLD.md`: Low-Level Design
- `docs/Technical_Documentation.md`: Technical documentation
- `src/rag_support_assistant/`: working codebase
- `data/knowledge_base.pdf`: source document for ingestion

## Suggested Flow
1. Put the support PDF inside `data/knowledge_base.pdf`.
2. Implement ingestion in `loader.py`, `chunker.py`, `embeddings.py`, and `vector_store.py`.
3. Implement retrieval and routing in `retriever.py` and `router.py`.
4. Build the LangGraph workflow in `graph.py`.
5. Add escalation logic in `hitl.py`.
6. Run the project through `app.py`.
- `docs/HLD.md` -> High-Level Design
- `docs/LLD.md` -> Low-Level Design
- `docs/Technical_Documentation.md` -> Technical Documentation
- `server.js` + `public/` -> localhost demo implementation
- `src/rag_support_assistant/` -> modular architecture for RAG workflow design

## Limitations

- Best suited for text-based PDFs
- Scanned PDFs may require OCR for better extraction
- Current demo uses lightweight local retrieval instead of full production vector DB integration
- Full LLM integration can be added as a future upgrade

## Future Enhancements

- ChromaDB integration
- real embeddings
- LangGraph production workflow
- OpenAI or Hugging Face LLM support
- OCR for scanned PDFs
- multi-document support
- persistent chat history
- deployment to cloud or internal enterprise environments

## Documentation

This project also includes:
- High-Level Design
- Low-Level Design
- Technical Documentation

Writeups can be finalized in Markdown first and then exported as PDF for submission.

## Quick Run
1. Open PowerShell in the project folder.
2. Run `.\run_project.bat`
3. The app opens on `http://localhost:3000`
4. Upload any support PDF and start asking questions
## Conclusion

## UI Features
- Localhost web interface
- PDF upload and switchable knowledge base
- RAG-style chunk retrieval
- Intent routing with escalation
- Confidence and retrieved context display
This project is not just a chatbot demo.  
It is a document-grounded support assistant that reflects the design principles of a real AI system:
- retrieval before response
- controlled workflow logic
- escalation when automation is not enough

## Notes
- Write the final design documents in Markdown first, then export them as PDF for submission.
- Keep the working project optional but preferred.
That makes it a strong applied project for understanding **RAG, workflow systems, and practical AI support design**.

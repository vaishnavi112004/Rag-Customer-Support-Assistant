import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const PORT = 3000;
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DEFAULT_PDF = path.join(DATA_DIR, "knowledge_base.pdf");

const ESCALATION_KEYWORDS = new Set([
  "refund",
  "legal",
  "complaint",
  "urgent",
  "fraud",
  "hack",
  "compromise",
  "lawsuit",
]);

let activeKnowledgeBase = null;

ensureDir(DATA_DIR);
ensureDir(UPLOADS_DIR);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function decodePdfString(value) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function extractTextOperators(content) {
  const lines = [];
  const simpleMatches = content.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)\s*T[jJ]/g);
  for (const match of simpleMatches) {
    lines.push(decodePdfString(match[1]));
  }

  const arrayMatches = content.matchAll(/\[(.*?)\]\s*TJ/gs);
  for (const match of arrayMatches) {
    const innerStrings = [...match[1].matchAll(/\(([^()]*(?:\\.[^()]*)*)\)/g)];
    for (const item of innerStrings) {
      lines.push(decodePdfString(item[1]));
    }
  }

  return lines.filter(Boolean);
}

function tryInflate(buffer) {
  const candidates = [];
  for (const inflater of [zlib.inflateSync, zlib.inflateRawSync]) {
    try {
      candidates.push(inflater(buffer).toString("latin1"));
    } catch {
      // Ignore non-compressed streams.
    }
  }
  return candidates;
}

function extractPdfTextFromBuffer(buffer) {
  const binary = buffer.toString("latin1");
  const collected = [];

  for (const item of extractTextOperators(binary)) {
    collected.push(item);
  }

  const streamPattern = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = streamPattern.exec(binary)) !== null) {
    const streamBuffer = Buffer.from(match[1], "latin1");
    const candidates = [match[1], ...tryInflate(streamBuffer)];
    for (const candidate of candidates) {
      for (const item of extractTextOperators(candidate)) {
        collected.push(item);
      }
    }
  }

  const text = normalizeWhitespace(collected.join(" "));
  if (!text) {
    throw new Error("Could not extract readable text from the PDF.");
  }
  return text;
}

function chunkText(text, chunkSize = 420, overlap = 80) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    if (end < normalized.length) {
      const lastSpace = normalized.lastIndexOf(" ", end);
      if (lastSpace > start + Math.floor(chunkSize / 2)) {
        end = lastSpace;
      }
    }
    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(end - overlap, 0);
  }
  return chunks.filter(Boolean);
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []);
}

function embedText(text) {
  const counts = new Map();
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function cosineSimilarity(mapA, mapB) {
  if (!mapA.size || !mapB.size) {
    return 0;
  }

  let numerator = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const value of mapA.values()) {
    magnitudeA += value * value;
  }

  for (const value of mapB.values()) {
    magnitudeB += value * value;
  }

  for (const [token, value] of mapA.entries()) {
    if (mapB.has(token)) {
      numerator += value * mapB.get(token);
    }
  }

  if (!magnitudeA || !magnitudeB) {
    return 0;
  }

  return numerator / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function buildKnowledgeBase(text, sourceName) {
  const chunks = chunkText(text);
  return {
    sourceName,
    text,
    chunks,
    vectors: chunks.map((chunk) => ({ chunk, embedding: embedText(chunk) })),
  };
}

function searchKnowledgeBase(query, knowledgeBase, topK = 3) {
  const queryVector = embedText(query);
  const scored = knowledgeBase.vectors
    .map((item) => ({
      chunk: item.chunk,
      score: cosineSimilarity(queryVector, item.embedding),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);

  return {
    chunks: scored.map((item) => item.chunk),
    confidence: scored.length ? scored[0].score : 0,
  };
}

function shouldEscalate(query, chunks, confidence) {
  const lowered = query.toLowerCase();
  if (!chunks.length) {
    return true;
  }
  if (confidence < 0.18) {
    return true;
  }
  return [...ESCALATION_KEYWORDS].some((keyword) => lowered.includes(keyword));
}

function generateAnswer(query, chunks) {
  if (!chunks.length) {
    return "I could not find enough relevant information in the uploaded knowledge base.";
  }

  const queryTerms = new Set(tokenize(query));
  const candidateSentences = chunks
    .flatMap((chunk) => chunk.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const ranked = candidateSentences
    .map((sentence) => {
      const sentenceTerms = tokenize(sentence);
      const overlap = sentenceTerms.filter((term) => queryTerms.has(term)).length;
      return { sentence, overlap };
    })
    .sort((left, right) => right.overlap - left.overlap);

  const bestSentences = [...new Set(ranked.map((item) => item.sentence))].slice(0, 2);
  return `According to the knowledge base, ${bestSentences.join(" ")}`;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON payload."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".pdf": "application/pdf",
    }[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { error: "File not found." });
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function safeUploadName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function loadDefaultKnowledgeBase() {
  if (!fs.existsSync(DEFAULT_PDF)) {
    return;
  }

  const buffer = fs.readFileSync(DEFAULT_PDF);
  const text = extractPdfTextFromBuffer(buffer);
  activeKnowledgeBase = buildKnowledgeBase(text, path.basename(DEFAULT_PDF));
}

async function handleUpload(req, res) {
  try {
    const payload = await parseJsonBody(req);
    const { filename, fileData } = payload;

    if (!filename || !fileData) {
      sendJson(res, 400, { error: "Filename and fileData are required." });
      return;
    }

    if (!filename.toLowerCase().endsWith(".pdf")) {
      sendJson(res, 400, { error: "Only PDF files are supported." });
      return;
    }

    const safeName = `${Date.now()}_${safeUploadName(filename)}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    const buffer = Buffer.from(fileData, "base64");
    fs.writeFileSync(filePath, buffer);

    const text = extractPdfTextFromBuffer(buffer);
    activeKnowledgeBase = buildKnowledgeBase(text, filename);

    sendJson(res, 200, {
      ok: true,
      sourceName: filename,
      chunkCount: activeKnowledgeBase.chunks.length,
      preview: activeKnowledgeBase.text.slice(0, 260),
      storedAt: filePath,
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Upload failed." });
  }
}

async function handleChat(req, res) {
  try {
    if (!activeKnowledgeBase) {
      loadDefaultKnowledgeBase();
    }

    if (!activeKnowledgeBase) {
      sendJson(res, 400, { error: "No knowledge base is loaded yet." });
      return;
    }

    const payload = await parseJsonBody(req);
    const query = (payload.query || "").trim();

    if (!query) {
      sendJson(res, 400, { error: "Query is required." });
      return;
    }

    const { chunks, confidence } = searchKnowledgeBase(query, activeKnowledgeBase);
    const escalate = shouldEscalate(query, chunks, confidence);
    const answer = generateAnswer(query, chunks);

    sendJson(res, 200, {
      ok: true,
      query,
      sourceName: activeKnowledgeBase.sourceName,
      confidence,
      intent: escalate ? "escalate" : "answer",
      escalate,
      answer,
      retrievedChunks: chunks,
      humanMessage: escalate
        ? "This query should be handed to a human agent because it is sensitive, low-confidence, or missing clear context."
        : "",
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Chat request failed." });
  }
}

function handleStatus(res) {
  if (!activeKnowledgeBase) {
    loadDefaultKnowledgeBase();
  }

  sendJson(res, 200, {
    ok: true,
    hasKnowledgeBase: Boolean(activeKnowledgeBase),
    sourceName: activeKnowledgeBase ? activeKnowledgeBase.sourceName : null,
    chunkCount: activeKnowledgeBase ? activeKnowledgeBase.chunks.length : 0,
  });
}

function routeRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/status") {
    handleStatus(res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload") {
    handleUpload(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    handleChat(req, res);
    return;
  }

  const filePath = url.pathname === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, url.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Forbidden." });
    return;
  }
  sendFile(res, filePath);
}

loadDefaultKnowledgeBase();

const server = http.createServer(routeRequest);
server.listen(PORT, () => {
  console.log(`RAG support assistant running at http://localhost:${PORT}`);
});

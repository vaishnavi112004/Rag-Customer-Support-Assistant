const state = {
  selectedFile: null,
};

const kbStatus = document.getElementById("kbStatus");
const sourceName = document.getElementById("sourceName");
const chunkCount = document.getElementById("chunkCount");
const previewText = document.getElementById("previewText");
const chatMessages = document.getElementById("chatMessages");
const pdfInput = document.getElementById("pdfInput");
const uploadButton = document.getElementById("uploadButton");
const uploadZone = document.getElementById("uploadZone");
const chatForm = document.getElementById("chatForm");
const queryInput = document.getElementById("queryInput");
const sendButton = document.getElementById("sendButton");
const messageTemplate = document.getElementById("messageTemplate");

function setStatus(text, tone = "neutral") {
  kbStatus.textContent = text;
  kbStatus.style.background =
    tone === "error"
      ? "rgba(141, 39, 39, 0.12)"
      : tone === "success"
        ? "rgba(31, 108, 95, 0.12)"
        : "rgba(35, 24, 11, 0.08)";
  kbStatus.style.color =
    tone === "error" ? "#8d2727" : tone === "success" ? "#1f6c5f" : "#6a5c4b";
}

function appendMessage(role, text, details = null) {
  const fragment = messageTemplate.content.cloneNode(true);
  const message = fragment.querySelector(".message");
  const avatar = fragment.querySelector(".message-avatar");
  const body = fragment.querySelector(".message-text");
  const insightBox = fragment.querySelector(".insight-box");
  const intentValue = fragment.querySelector(".intent-value");
  const confidenceValue = fragment.querySelector(".confidence-value");
  const sourceValue = fragment.querySelector(".source-value");
  const humanLine = fragment.querySelector(".human-line");
  const humanValue = fragment.querySelector(".human-value");
  const contextList = fragment.querySelector(".context-list");

  message.classList.add(role);
  avatar.textContent = role === "user" ? "You" : "AI";
  body.textContent = text;

  if (details) {
    insightBox.classList.remove("hidden");
    intentValue.textContent = details.intent || "unknown";
    confidenceValue.textContent = typeof details.confidence === "number"
      ? details.confidence.toFixed(2)
      : "-";
    sourceValue.textContent = details.sourceName || "-";

    if (details.humanMessage) {
      humanLine.classList.remove("hidden");
      humanValue.textContent = details.humanMessage;
    }

    if (Array.isArray(details.retrievedChunks)) {
      details.retrievedChunks.forEach((chunk, index) => {
        const block = document.createElement("div");
        block.className = "context-item";
        block.textContent = `Context ${index + 1}: ${chunk}`;
        contextList.appendChild(block);
      });
    }
  }

  chatMessages.appendChild(fragment);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function refreshStatus() {
  try {
    const response = await fetch("/api/status");
    const data = await response.json();
    sourceName.textContent = data.sourceName || "None";
    chunkCount.textContent = data.chunkCount || 0;
    setStatus(data.hasKnowledgeBase ? "Ready" : "No PDF", data.hasKnowledgeBase ? "success" : "neutral");
  } catch {
    setStatus("Offline", "error");
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadSelectedFile() {
  if (!state.selectedFile) {
    setStatus("Choose PDF first", "error");
    return;
  }

  uploadButton.disabled = true;
  setStatus("Uploading...", "neutral");

  try {
    const fileData = await readFileAsBase64(state.selectedFile);
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: state.selectedFile.name,
        fileData,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Upload failed.");
    }

    sourceName.textContent = data.sourceName;
    chunkCount.textContent = data.chunkCount;
    previewText.textContent = data.preview;
    setStatus("Uploaded", "success");
    appendMessage(
      "assistant",
      `Knowledge base switched to "${data.sourceName}". You can ask questions from this uploaded PDF now.`
    );
  } catch (error) {
    setStatus("Upload failed", "error");
    appendMessage("assistant", error.message || "Upload failed.");
  } finally {
    uploadButton.disabled = false;
  }
}

async function sendQuery(query) {
  appendMessage("user", query);
  queryInput.value = "";
  sendButton.disabled = true;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    appendMessage("assistant", data.answer, data);
  } catch (error) {
    appendMessage("assistant", error.message || "Something went wrong.");
  } finally {
    sendButton.disabled = false;
  }
}

pdfInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  state.selectedFile = file;
  setStatus(file.name, "neutral");
});

uploadButton.addEventListener("click", uploadSelectedFile);

uploadZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  uploadZone.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("drag-over");
});

uploadZone.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = event.dataTransfer.files[0];
  if (file) {
    state.selectedFile = file;
    pdfInput.files = event.dataTransfer.files;
    setStatus(file.name, "neutral");
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();
  if (!query) {
    return;
  }
  await sendQuery(query);
});

document.querySelectorAll(".sample-chip").forEach((button) => {
  button.addEventListener("click", () => {
    queryInput.value = button.textContent.trim();
    queryInput.focus();
  });
});

refreshStatus();

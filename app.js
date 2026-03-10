function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let currentChatController = null;
let stopTypingRequested = false;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

async function safeFetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || `Erro HTTP ${response.status}`);
  }

  return safeObject(data);
}

window.AppSafe = {
  safeArray,
  safeObject,
  safeString,
  safeFetchJson
};

function scrollChatToBottom() {
  const el = document.getElementById("chatHistory");
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

async function typeText(el, text, speed = 8) {
  const safeText = safeString(text, "");
  el.textContent = "";

  for (let i = 0; i < safeText.length; i++) {
    if (stopTypingRequested) {
      el.textContent = safeText;
      break;
    }
    el.textContent += safeText[i];
    scrollChatToBottom();
    await sleep(speed);
  }
}

function setupFlashAutoHide() {
  const flash = document.querySelector(".flash");
  if (!flash) return;
  setTimeout(() => flash.classList.add("hide"), 2600);
}

window.NexusUpload = (function () {
  let lastImageUrl = null;

  function uploadWithProgress(file, onProgress) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("Selecione uma imagem"));
        return;
      }

      const fd = new FormData();
      fd.append("image", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload-image", true);

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const percent = Math.round((e.loaded / e.total) * 100);
        if (onProgress) onProgress(percent);
      };

      xhr.onload = () => {
        try {
          const j = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && j.ok) {
            lastImageUrl = j.url;
            resolve(j.url);
          } else {
            reject(new Error(j.error || "Falha no upload"));
          }
        } catch {
          reject(new Error("Resposta inválida do upload"));
        }
      };

      xhr.onerror = () => reject(new Error("Falha de conexão no upload"));
      xhr.send(fd);
    });
  }

  function getLastUrl() {
    return lastImageUrl;
  }

  function setLastUrl(url) {
    lastImageUrl = url || null;
  }

  return { uploadWithProgress, getLastUrl, setLastUrl };
})();

function showTyping(on) {
  const row = document.getElementById("typingRow");
  if (!row) return;
  row.style.display = on ? "flex" : "none";
  if (on) scrollChatToBottom();
}

function buildMessageBubble(role, text = "", imageUrl = null) {
  const row = document.createElement("div");
  row.className = "msgRow " + (role === "user" ? "user" : "assistant");

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = role === "user" ? "Você" : "IA";

  const wrap = document.createElement("div");
  wrap.className = "msgWrap";

  const msg = document.createElement("div");
  msg.className = "msg " + (role === "user" ? "user" : "assistant");
  msg.textContent = safeString(text, "");

  wrap.appendChild(msg);

  if (imageUrl) {
    const img = document.createElement("img");
    img.className = "msgImage";
    img.src = imageUrl;
    img.alt = "Imagem enviada";
    wrap.appendChild(img);
  }

  if (role !== "user") {
    const actions = document.createElement("div");
    actions.className = "msgActions";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "tinyBtn";
    copyBtn.textContent = "Copiar";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(safeString(text, ""));
        copyBtn.textContent = "Copiado";
        setTimeout(() => {
          copyBtn.textContent = "Copiar";
        }, 1200);
      } catch {
        copyBtn.textContent = "Erro";
        setTimeout(() => {
          copyBtn.textContent = "Copiar";
        }, 1200);
      }
    });

    actions.appendChild(copyBtn);
    wrap.appendChild(actions);
  }

  if (role === "user") {
    row.appendChild(wrap);
    row.appendChild(meta);
  } else {
    row.appendChild(meta);
    row.appendChild(wrap);
  }

  return { row, msg };
}

function appendUserMessage(text, imageUrl = null) {
  const history = document.getElementById("chatHistory");
  const typingRow = document.getElementById("typingRow");
  if (!history) return;

  const { row } = buildMessageBubble("user", text || "", imageUrl);

  if (typingRow) history.insertBefore(row, typingRow);
  else history.appendChild(row);

  scrollChatToBottom();
}

async function appendAssistantMessageAnimated(text) {
  const history = document.getElementById("chatHistory");
  const typingRow = document.getElementById("typingRow");
  if (!history) return;

  const { row, msg } = buildMessageBubble("assistant", "", null);

  if (typingRow) history.insertBefore(row, typingRow);
  else history.appendChild(row);

  scrollChatToBottom();
  await typeText(msg, text, 8);
}

function setSendingState(isSending) {
  const btn = document.getElementById("sendBtn");
  const ta = document.getElementById("messageInput");
  const pickBtn = document.getElementById("pickImageBtn");
  const camBtn = document.getElementById("takePhotoBtn");
  const stopBtn = document.getElementById("stopBtn");

  if (btn) {
    btn.disabled = isSending;
    btn.textContent = isSending ? "Enviando..." : "Enviar";
  }

  if (stopBtn) {
    stopBtn.disabled = !isSending;
  }

  if (ta) ta.disabled = isSending;
  if (pickBtn) pickBtn.disabled = isSending;
  if (camBtn) camBtn.disabled = isSending;
}

function autoResizeTextarea() {
  const ta = document.getElementById("messageInput");
  if (!ta) return;

  function resize() {
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }

  ta.addEventListener("input", resize);
  resize();
}

function clearPreview() {
  const previewWrap = document.getElementById("previewWrap");
  const previewImage = document.getElementById("previewImage");
  const previewLabel = document.getElementById("previewLabel");
  const imagePicker = document.getElementById("imagePicker");
  const cameraPicker = document.getElementById("cameraPicker");
  const uploadBar = document.getElementById("uploadBar");
  const uploadBarInner = document.getElementById("uploadBarInner");

  if (previewWrap) previewWrap.classList.remove("show");
  if (previewImage) previewImage.removeAttribute("src");
  if (previewLabel) previewLabel.textContent = "Imagem selecionada";
  if (imagePicker) imagePicker.value = "";
  if (cameraPicker) cameraPicker.value = "";
  if (uploadBar) uploadBar.classList.remove("show");
  if (uploadBarInner) uploadBarInner.style.width = "0%";

  window.NexusUpload?.setLastUrl?.(null);
}

function setupImageTools() {
  const pickBtn = document.getElementById("pickImageBtn");
  const takeBtn = document.getElementById("takePhotoBtn");
  const imagePicker = document.getElementById("imagePicker");
  const cameraPicker = document.getElementById("cameraPicker");
  const previewWrap = document.getElementById("previewWrap");
  const previewImage = document.getElementById("previewImage");
  const previewLabel = document.getElementById("previewLabel");
  const removeBtn = document.getElementById("removePreviewBtn");
  const uploadBar = document.getElementById("uploadBar");
  const uploadBarInner = document.getElementById("uploadBarInner");
  const dropZone = document.getElementById("dropZone");

  if (!pickBtn || !takeBtn || !imagePicker || !cameraPicker) return;

  async function handleFile(file) {
    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
      alert("Selecione apenas imagem.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    if (previewImage) previewImage.src = localUrl;
    if (previewWrap) previewWrap.classList.add("show");
    if (previewLabel) previewLabel.textContent = file.name || "Imagem pronta para enviar";
    if (uploadBar) uploadBar.classList.add("show");
    if (uploadBarInner) uploadBarInner.style.width = "0%";

    try {
      if (previewLabel) previewLabel.textContent = "Enviando imagem...";

      const uploadedUrl = await window.NexusUpload.uploadWithProgress(file, (percent) => {
        if (uploadBarInner) uploadBarInner.style.width = percent + "%";
      });

      if (previewLabel) previewLabel.textContent = "Imagem pronta para enviar";
      window.NexusUpload.setLastUrl(uploadedUrl);

      if (uploadBarInner) uploadBarInner.style.width = "100%";
    } catch (e) {
      clearPreview();
      alert("Erro ao enviar imagem: " + (e.message || "falha"));
    }
  }

  pickBtn.addEventListener("click", () => imagePicker.click());
  takeBtn.addEventListener("click", () => cameraPicker.click());

  if (removeBtn) {
    removeBtn.addEventListener("click", clearPreview);
  }

  imagePicker.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    await handleFile(file);
  });

  cameraPicker.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    await handleFile(file);
  });

  if (dropZone) {
    ["dragenter", "dragover"].forEach((evt) => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((evt) => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("dragover");
      });
    });

    dropZone.addEventListener("drop", async (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      if (!file.type || !file.type.startsWith("image/")) {
        alert("Arraste apenas imagem.");
        return;
      }

      await handleFile(file);
    });
  }
}

function setupCopyButtons() {
  document.querySelectorAll(".copyBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copiado";
        setTimeout(() => {
          btn.textContent = "Copiar";
        }, 1200);
      } catch {
        btn.textContent = "Erro";
        setTimeout(() => {
          btn.textContent = "Copiar";
        }, 1200);
      }
    });
  });
}

function setupNewThread() {
  const btn = document.getElementById("newThreadBtn");
  const agentSelect = document.getElementById("agent_id");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Criando...";

    try {
      const j = await safeFetchJson("/api/chat/new-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentSelect ? agentSelect.value : null
        })
      });

      if (!j.ok) {
        alert(j.error || "Falha ao criar conversa");
        return;
      }

      window.location.href = "/chat?thread_id=" + j.thread_id;
    } catch (e) {
      alert("Erro: " + (e.message || "falha"));
    } finally {
      btn.disabled = false;
      btn.textContent = "+ Nova conversa";
    }
  });
}

function setupMobileFixes() {
  const ta = document.getElementById("messageInput");
  if (!ta) return;

  ta.addEventListener("focus", () => {
    setTimeout(() => {
      ta.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
  });

  window.addEventListener("resize", () => {
    scrollChatToBottom();
  });
}

function setupChat() {
  const form = document.getElementById("chatForm");
  const ta = document.getElementById("messageInput");
  const agentSelect = document.getElementById("agent_id");
  const threadIdEl = document.getElementById("threadId");
  const stopBtn = document.getElementById("stopBtn");

  if (!form || !ta) return;

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      stopTypingRequested = true;

      if (currentChatController) {
        currentChatController.abort();
      }

      showTyping(false);
      setSendingState(false);
    });
  }

  ta.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;

    e.preventDefault();
    form.requestSubmit();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = ta.value.trim();
    const imageUrl = window.NexusUpload?.getLastUrl?.() || null;
    const threadId = threadIdEl ? threadIdEl.value : "";

    if (!text && !imageUrl) return;

    appendUserMessage(text || "[Imagem enviada]", imageUrl);

    ta.value = "";
    ta.style.height = "54px";
    setSendingState(true);
    showTyping(true);
    stopTypingRequested = false;

    currentChatController = new AbortController();

    try {
      const j = await safeFetchJson("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: currentChatController.signal,
        body: JSON.stringify({
          text: text,
          message: text,
          agent_id: agentSelect ? agentSelect.value : null,
          image_url: imageUrl,
          thread_id: threadId || null
        })
      });

      showTyping(false);

      if (threadIdEl && j.thread_id && !threadIdEl.value) {
        threadIdEl.value = j.thread_id;
        history.replaceState(null, "", "/chat?thread_id=" + j.thread_id);
      }

      await appendAssistantMessageAnimated(j.answer || "Sem resposta.");
      clearPreview();
    } catch (err) {
      showTyping(false);

      if (err.name === "AbortError") {
        await appendAssistantMessageAnimated("Resposta interrompida.");
      } else {
        await appendAssistantMessageAnimated("Erro: " + (err.message || "falha de conexão."));
      }
    } finally {
      currentChatController = null;
      setSendingState(false);
      ta.focus();
    }
  });

  scrollChatToBottom();
}

document.addEventListener("DOMContentLoaded", () => {
  setupFlashAutoHide();
  autoResizeTextarea();
  setupImageTools();
  setupCopyButtons();
  setupNewThread();
  setupMobileFixes();
  setupChat();
});
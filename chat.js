document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");
  const imageModeBtn = document.getElementById("imageModeBtn");

  let imageMode = false;

  function appendMessage(type, text) {
    const row = document.createElement("div");
    row.className = "msg-row";

    row.innerHTML = `
      <div class="msg-avatar ${type}">${type === "user" ? "U" : "N"}</div>
      <div class="msg-bubble ${type}"></div>
    `;

    row.querySelector(".msg-bubble").textContent = text;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendImage(url, prompt) {
    const row = document.createElement("div");
    row.className = "msg-row";

    row.innerHTML = `
      <div class="msg-avatar ai">N</div>
      <div class="msg-bubble ai">
        <div>Imagem gerada para: ${prompt}</div>
        <img src="${url}" alt="Imagem gerada" style="width:100%;margin-top:12px;border-radius:16px;" />
      </div>
    `;

    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function setTyping() {
    const row = document.createElement("div");
    row.className = "msg-row";
    row.id = "typingRow";

    row.innerHTML = `
      <div class="msg-avatar ai">N</div>
      <div class="msg-bubble ai">Digitando...</div>
    `;

    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function clearTyping() {
    const typing = document.getElementById("typingRow");
    if (typing) typing.remove();
  }

  if (imageModeBtn) {
    imageModeBtn.addEventListener("click", () => {
      imageMode = !imageMode;
      imageModeBtn.style.outline = imageMode ? "2px solid #7b2cff" : "none";
    });
  }

  if (input) {
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 180) + "px";
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (form) form.requestSubmit();
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      appendMessage("user", text);
      input.value = "";
      input.style.height = "auto";
      setTyping();

      try {
        if (imageMode) {
          const body = new URLSearchParams({ prompt: text });

          const res = await fetch("/image/generate", {
            method: "POST",
            body,
          });

          const data = await res.json();
          clearTyping();

          if (data.ok) {
            appendImage(data.image_url, data.prompt);
          } else {
            appendMessage("ai", data.error || "Erro ao gerar imagem.");
          }
        } else {
          const body = new URLSearchParams({ message: text });

          const res = await fetch("/chat/message", {
            method: "POST",
            body,
          });

          const data = await res.json();
          clearTyping();

          appendMessage("ai", data.reply || "Sem resposta.");
        }
      } catch (error) {
        clearTyping();
        appendMessage("ai", "Erro ao falar com o servidor.");
      }
    });
  }
});
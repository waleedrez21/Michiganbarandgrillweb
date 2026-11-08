/* =========================================================
   Michigan Bar & Grill — AI Chat Widget
   Floating chat bubble that talks to the booking-agent backend.
   Drop this file in as js/chat-widget.js and include it on every
   page (see snippet at the bottom of this file for the include).
   ========================================================= */

   (function () {
    // ---- Configuration ----------------------------------------------------
    const BACKEND_URL = "https://michigan-bar-grill-backend-production.up.railway.app";
    const BUSINESS_ID = "michigan-bar-grill";
    // -------------------------------------------------------------------------
  
    const STORAGE_KEY = "mbg_chat_session_id";
    const AI_CONSENT_VERSION = "2026-11-02";
  
    function getSessionId() {
      try {
        return sessionStorage.getItem(STORAGE_KEY);
      } catch (e) {
        return null;
      }
    }
  
    function setSessionId(id) {
      try {
        sessionStorage.setItem(STORAGE_KEY, id);
      } catch (e) {
        /* sessionStorage unavailable — conversation just won't persist across reloads */
      }
    }
  
    async function sendMessage(message) {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WorkBay-Business": BUSINESS_ID,
        },
        body: JSON.stringify({ sessionId: getSessionId(), message, aiConsent: AI_CONSENT_VERSION }),
      });
  
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Something went wrong. Please call us instead.");
      }
  
      const data = await res.json();
      setSessionId(data.sessionId);
      return data;
    }
  
    // ---- Build the widget UI ----------------------------------------------
    const style = document.createElement("style");
    style.textContent = `
      #mbg-chat-launcher {
        position: fixed;
        bottom: 24px;
        left: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--navy, #1b2431);
        color: var(--cream, #f4efe2);
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 30px -8px rgba(16,21,29,0.5);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      }
      #mbg-chat-launcher:hover { transform: scale(1.06); }
      #mbg-chat-launcher svg { width: 26px; height: 26px; }
  
      #mbg-chat-window {
        position: fixed;
        bottom: 96px;
        left: 24px;
        width: 360px;
        max-width: calc(100vw - 32px);
        height: 480px;
        max-height: calc(100vh - 140px);
        background: var(--cream-soft, #faf7f0);
        border-radius: 10px;
        box-shadow: 0 24px 60px -16px rgba(16,21,29,0.45);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 999;
        font-family: var(--font-body, "Manrope", sans-serif);
      }
      #mbg-chat-window.open { display: flex; }
  
      #mbg-chat-header {
        background: var(--navy, #1b2431);
        color: var(--cream, #f4efe2);
        padding: 16px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #mbg-chat-header .title {
        font-family: var(--font-display, "Fraunces", serif);
        font-size: 1.05rem;
      }
      #mbg-chat-header .subtitle {
        font-size: 0.72rem;
        color: rgba(244,239,226,0.65);
        margin-top: 2px;
      }
      #mbg-chat-close {
        background: none;
        border: none;
        color: var(--cream, #f4efe2);
        cursor: pointer;
        font-size: 1.3rem;
        line-height: 1;
        opacity: 0.7;
      }
      #mbg-chat-close:hover { opacity: 1; }
  
      #mbg-chat-header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #mbg-chat-restart {
        background: none;
        border: 1px solid rgba(244,239,226,0.3);
        color: var(--cream, #f4efe2);
        cursor: pointer;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding: 5px 9px;
        border-radius: 6px;
        opacity: 0.75;
      }
      #mbg-chat-restart:hover { opacity: 1; border-color: var(--gold, #b4884b); }
  
      #mbg-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .mbg-msg {
        max-width: 85%;
        padding: 10px 13px;
        border-radius: 10px;
        font-size: 0.88rem;
        line-height: 1.45;
        white-space: pre-wrap;
      }
      .mbg-msg.user {
        align-self: flex-end;
        background: var(--navy, #1b2431);
        color: var(--cream, #f4efe2);
        border-bottom-right-radius: 2px;
      }
      .mbg-msg.agent {
        align-self: flex-start;
        background: #fff;
        border: 1px solid rgba(27,36,49,0.1);
        color: var(--ink, #211f1b);
        border-bottom-left-radius: 2px;
      }
      .mbg-msg.error {
        align-self: center;
        background: #fdecec;
        color: #a33;
        font-size: 0.8rem;
        text-align: center;
      }
      .mbg-msg.typing {
        align-self: flex-start;
        background: #fff;
        border: 1px solid rgba(27,36,49,0.1);
        color: #999;
        font-style: italic;
      }
  
      #mbg-chat-form {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid rgba(27,36,49,0.08);
        background: #fff;
      }
      #mbg-chat-input {
        flex: 1;
        border: 1px solid rgba(27,36,49,0.15);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 0.88rem;
        font-family: inherit;
        resize: none;
      }
      #mbg-chat-input:focus { outline: none; border-color: var(--gold, #b4884b); }
      #mbg-chat-send {
        background: var(--gold, #b4884b);
        color: var(--navy-deep, #10151d);
        border: none;
        border-radius: 8px;
        padding: 0 16px;
        font-weight: 700;
        font-size: 0.8rem;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      #mbg-chat-send:disabled { opacity: 0.5; cursor: default; }
  
      @media (max-width: 480px) {
        #mbg-chat-window {
          left: 12px;
          right: 12px;
          width: auto;
          bottom: 88px;
        }
        #mbg-chat-launcher { left: 16px; bottom: 16px; }
      }
    `;
    document.head.appendChild(style);
  
    const launcher = document.createElement("button");
    launcher.id = "mbg-chat-launcher";
    launcher.setAttribute("aria-label", "Chat with us");
    launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
  
    const chatWindow = document.createElement("div");
    chatWindow.id = "mbg-chat-window";
    chatWindow.innerHTML = `
      <div id="mbg-chat-header">
        <div>
          <div class="title">Michigan Bar &amp; Grill</div>
          <div class="subtitle">Ask about hours, menu, or book the banquet hall</div>
        </div>
        <div id="mbg-chat-header-actions">
          <button id="mbg-chat-restart" aria-label="Start a new conversation">New Chat</button>
          <button id="mbg-chat-close" aria-label="Close chat">&times;</button>
        </div>
      </div>
      <div id="mbg-chat-messages"></div>
      <div style="padding: 8px 14px; font-size: 13px;">
        <a href="${BACKEND_URL}/api/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a> · <a href="tel:+15192529357">Call us instead</a>
      </div>
      <form id="mbg-chat-form">
        <textarea id="mbg-chat-input" rows="1" placeholder="Type a message..." required></textarea>
        <button type="submit" id="mbg-chat-send">Send</button>
      </form>
    `;
  
    document.body.appendChild(launcher);
    document.body.appendChild(chatWindow);
  
    const messagesEl = chatWindow.querySelector("#mbg-chat-messages");
    const formEl = chatWindow.querySelector("#mbg-chat-form");
    const inputEl = chatWindow.querySelector("#mbg-chat-input");
    const sendBtn = chatWindow.querySelector("#mbg-chat-send");
    const closeBtn = chatWindow.querySelector("#mbg-chat-close");
  
    let agreedToAIChat = false;
    let sending = false;
    function updateSendButton() {
      sendBtn.disabled = sending;
    }
    updateSendButton();

    let greeted = false;
  
    // Safety net: even with prompt instructions telling the AI to avoid
    // Markdown, models occasionally slip and use it anyway. Strip the most
    // common symbols so the customer never sees raw **, -, #, etc.
    function stripMarkdown(text) {
      return text
        .replace(/\*\*(.*?)\*\*/g, "$1") // **bold**
        .replace(/\*(.*?)\*/g, "$1")     // *italic*
        .replace(/^#{1,6}\s+/gm, "")     // # headers
        .replace(/^[-•]\s+/gm, "")       // - or • bullet points
        .replace(/^\d+\.\s+/gm, "");     // 1. numbered lists
    }
  
    function addMessage(text, role) {
      const el = document.createElement("div");
      el.className = `mbg-msg ${role}`;
      el.textContent = role === "agent" ? stripMarkdown(text) : text;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    }
  
    launcher.addEventListener("click", () => {
      chatWindow.classList.add("open");
      if (!greeted) {
        addMessage("Hi! I can help with our hours, menu, or booking the banquet hall. What can I help with?", "agent");
        greeted = true;
      }
      inputEl.focus();
    });
  
    const restartBtn = chatWindow.querySelector("#mbg-chat-restart");
  
    restartBtn.addEventListener("click", () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* ignore */
      }
      messagesEl.innerHTML = "";
      greeted = false;
      addMessage("Hi! I can help with our hours, menu, or booking the banquet hall. What can I help with?", "agent");
      greeted = true;
      inputEl.focus();
    });
  
    closeBtn.addEventListener("click", () => {
      chatWindow.classList.remove("open");
    });
  
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = inputEl.value.trim();
      if (!text || sending) return;
      if (!agreedToAIChat) {
        agreedToAIChat = window.confirm("Send your chat messages to DeepSeek to answer questions and arrange bookings? Choose Cancel to keep your message unsent.");
        if (!agreedToAIChat) return;
      }
  
      addMessage(text, "user");
      inputEl.value = "";
      sending = true;
      updateSendButton();
  
      const typingEl = addMessage("Typing...", "typing");
  
      try {
        const data = await sendMessage(text);
        typingEl.remove();
        addMessage(data.reply, "agent");

        if (Array.isArray(data.cartActions) && data.cartActions.length && window.MBGCart) {
          window.MBGCart.addItems(data.cartActions);
        }
      } catch (err) {
        typingEl.remove();
        addMessage(err.message || "Something went wrong. Please call us instead.", "error");
      } finally {
        sending = false;
        updateSendButton();
        inputEl.focus();
      }
    });
  
    // Let Enter submit, Shift+Enter add a newline
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formEl.requestSubmit();
      }
    });
  })();
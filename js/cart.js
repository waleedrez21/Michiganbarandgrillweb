/* =========================================================
   Michigan Bar & Grill — Cart & Checkout Widget
   Floating cart button + slide-in drawer that talks to the
   ordering backend and hands off to Stripe Checkout.
   Drop this file in as js/cart.js and include it on every page,
   alongside js/main.js. Works with dish-cards that have
   data-id / data-name / data-price attributes and an
   .add-cart-btn button inside them.
   ========================================================= */

(function () {
  // ---- Configuration ----------------------------------------------------
  const BACKEND_URL = "https://michigan-bar-grill-backend-production.up.railway.app";
  const API_KEY = "biz_1b57ac318b3102c96539e82c9d1f7ffb5814703cbad3b67d"; // Michigan Bar & Grill's business API key
  // -------------------------------------------------------------------------

  const STORAGE_KEY = "mbg_cart";

  function getCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      /* storage unavailable — cart just won't persist across reloads */
    }
  }

  function addToCart(id, name, price) {
    const cart = getCart();
    const existing = cart.find((i) => i.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id, name, price, quantity: 1 });
    }
    saveCart(cart);
    renderCart();
    openDrawer();
  }

  function updateQuantity(id, delta) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.quantity += delta;
    const next = item.quantity <= 0 ? cart.filter((i) => i.id !== id) : cart;
    saveCart(next);
    renderCart();
  }

  function removeItem(id) {
    saveCart(getCart().filter((i) => i.id !== id));
    renderCart();
  }

  function cartTotal(cart) {
    return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  function cartCount(cart) {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }

  // ---- Build the widget UI ----------------------------------------------
  const style = document.createElement("style");
  style.textContent = `
    #mbg-cart-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--gold, #b4884b);
      color: var(--navy-deep, #10151d);
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 30px -8px rgba(16,21,29,0.5);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }
    #mbg-cart-launcher:hover { transform: scale(1.06); }
    #mbg-cart-launcher svg { width: 24px; height: 24px; }

    #mbg-cart-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 10px;
      background: var(--navy-deep, #10151d);
      color: var(--cream, #f4efe2);
      font-family: var(--font-body, "Manrope", sans-serif);
      font-size: 0.68rem;
      font-weight: 700;
      display: none;
      align-items: center;
      justify-content: center;
    }
    #mbg-cart-badge.show { display: flex; }

    #mbg-cart-drawer {
      position: fixed;
      top: 0;
      right: -420px;
      width: 380px;
      max-width: 92vw;
      height: 100vh;
      background: var(--cream-soft, #faf7f0);
      box-shadow: -24px 0 60px -16px rgba(16,21,29,0.45);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      font-family: var(--font-body, "Manrope", sans-serif);
      transition: right 0.28s ease;
    }
    #mbg-cart-drawer.open { right: 0; }

    #mbg-cart-overlay {
      position: fixed;
      inset: 0;
      background: rgba(16,21,29,0.4);
      z-index: 999;
      display: none;
    }
    #mbg-cart-overlay.open { display: block; }

    #mbg-cart-header {
      background: var(--navy, #1b2431);
      color: var(--cream, #f4efe2);
      padding: 20px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #mbg-cart-header .title {
      font-family: var(--font-display, "Fraunces", serif);
      font-size: 1.2rem;
    }
    #mbg-cart-close {
      background: none;
      border: none;
      color: var(--cream, #f4efe2);
      cursor: pointer;
      font-size: 1.4rem;
      line-height: 1;
      opacity: 0.7;
    }
    #mbg-cart-close:hover { opacity: 1; }

    #mbg-cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 18px 22px;
    }
    .mbg-cart-empty {
      color: var(--ink-soft, #4a473f);
      font-size: 0.9rem;
      text-align: center;
      margin-top: 40px;
    }
    .mbg-cart-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 0;
      border-bottom: 1px solid var(--line, rgba(27,36,49,0.12));
    }
    .mbg-cart-item-name {
      font-family: var(--font-display, "Fraunces", serif);
      font-size: 1rem;
      color: var(--navy-deep, #10151d);
      margin-bottom: 6px;
    }
    .mbg-cart-item-price {
      font-size: 0.82rem;
      color: var(--ink-soft, #4a473f);
    }
    .mbg-cart-qty {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
    }
    .mbg-qty-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid var(--line, rgba(27,36,49,0.12));
      background: #fff;
      cursor: pointer;
      font-size: 0.85rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--navy-deep, #10151d);
    }
    .mbg-qty-btn:hover { border-color: var(--gold, #b4884b); }
    .mbg-cart-item-remove {
      background: none;
      border: none;
      color: var(--ink-soft, #4a473f);
      font-size: 0.72rem;
      text-decoration: underline;
      cursor: pointer;
      padding: 0;
      align-self: flex-start;
    }
    .mbg-cart-item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: space-between;
    }
    .mbg-cart-line-total {
      font-family: var(--font-display, "Fraunces", serif);
      color: var(--gold, #b4884b);
      font-size: 1rem;
    }

    #mbg-cart-footer {
      padding: 18px 22px 22px;
      border-top: 1px solid var(--line, rgba(27,36,49,0.12));
      background: #fff;
    }
    #mbg-cart-total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 14px;
    }
    #mbg-cart-total-row .label {
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink-soft, #4a473f);
    }
    #mbg-cart-total-row .amount {
      font-family: var(--font-display, "Fraunces", serif);
      font-size: 1.4rem;
      color: var(--navy-deep, #10151d);
    }
    #mbg-cart-checkout {
      width: 100%;
      background: var(--gold, #b4884b);
      color: var(--navy-deep, #10151d);
      border: none;
      border-radius: var(--radius, 2px);
      padding: 15px;
      font-weight: 700;
      font-size: 0.82rem;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      cursor: pointer;
    }
    #mbg-cart-checkout:hover { background: var(--gold-light, #d8b677); }
    #mbg-cart-checkout:disabled { opacity: 0.6; cursor: default; }
    #mbg-cart-error {
      color: #a33;
      font-size: 0.8rem;
      margin-top: 10px;
      text-align: center;
      display: none;
    }

    #mbg-cart-details {
      margin-bottom: 14px;
    }
    #mbg-cart-details .field {
      margin-bottom: 10px;
    }
    #mbg-cart-details label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--ink-soft, #4a473f);
      margin-bottom: 5px;
    }
    #mbg-cart-details input {
      width: 100%;
      padding: 10px 11px;
      border: 1px solid var(--line, rgba(27,36,49,0.12));
      border-radius: var(--radius, 2px);
      font-family: var(--font-body, "Manrope", sans-serif);
      font-size: 0.88rem;
      color: var(--ink, #211f1b);
      background: var(--cream-soft, #faf7f0);
    }
    #mbg-cart-details input:focus {
      outline: none;
      border-color: var(--gold, #b4884b);
    }
    #mbg-cart-pickup-note {
      font-size: 0.72rem;
      color: var(--ink-soft, #4a473f);
      margin-bottom: 12px;
    }

    @media (max-width: 480px) {
      #mbg-cart-drawer { width: 100vw; max-width: 100vw; }
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "mbg-cart-launcher";
  launcher.setAttribute("aria-label", "View cart");
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    <span id="mbg-cart-badge">0</span>
  `;

  const overlay = document.createElement("div");
  overlay.id = "mbg-cart-overlay";

  const drawer = document.createElement("div");
  drawer.id = "mbg-cart-drawer";
  drawer.innerHTML = `
    <div id="mbg-cart-header">
      <div class="title">Your Order</div>
      <button id="mbg-cart-close" aria-label="Close cart">&times;</button>
    </div>
    <div id="mbg-cart-items"></div>
    <div id="mbg-cart-footer">
      <div id="mbg-cart-details">
        <p id="mbg-cart-pickup-note">We'll use this to have your order ready and call you when it's done.</p>
        <div class="field">
          <label for="mbg-cart-name">Name</label>
          <input type="text" id="mbg-cart-name" placeholder="Your name" autocomplete="name">
        </div>
        <div class="field">
          <label for="mbg-cart-phone">Phone</label>
          <input type="tel" id="mbg-cart-phone" placeholder="(519) 555-1234" autocomplete="tel">
        </div>
      </div>
      <div id="mbg-cart-total-row">
        <span class="label">Total</span>
        <span class="amount" id="mbg-cart-total">$0.00</span>
      </div>
      <button id="mbg-cart-checkout" type="button">Checkout</button>
      <div id="mbg-cart-error"></div>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  const badgeEl = launcher.querySelector("#mbg-cart-badge");
  const itemsEl = drawer.querySelector("#mbg-cart-items");
  const totalEl = drawer.querySelector("#mbg-cart-total");
  const checkoutBtn = drawer.querySelector("#mbg-cart-checkout");
  const errorEl = drawer.querySelector("#mbg-cart-error");
  const closeBtn = drawer.querySelector("#mbg-cart-close");
  const nameInput = drawer.querySelector("#mbg-cart-name");
  const phoneInput = drawer.querySelector("#mbg-cart-phone");

  const DETAILS_KEY = "mbg_customer_details";
  try {
    const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
    if (saved.name) nameInput.value = saved.name;
    if (saved.phone) phoneInput.value = saved.phone;
  } catch (e) {
    /* ignore */
  }

  function openDrawer() {
    drawer.classList.add("open");
    overlay.classList.add("open");
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
  }

  function renderCart() {
    const cart = getCart();
    const count = cartCount(cart);

    badgeEl.textContent = String(count);
    badgeEl.classList.toggle("show", count > 0);

    if (!cart.length) {
      itemsEl.innerHTML = `<p class="mbg-cart-empty">Your cart is empty. Add something tasty from the menu!</p>`;
    } else {
      itemsEl.innerHTML = cart
        .map(
          (item) => `
        <div class="mbg-cart-item" data-id="${item.id}">
          <div>
            <div class="mbg-cart-item-name">${item.name}</div>
            <div class="mbg-cart-item-price">$${item.price.toFixed(2)} each</div>
            <div class="mbg-cart-qty">
              <button class="mbg-qty-btn" data-action="dec" aria-label="Decrease quantity">&minus;</button>
              <span>${item.quantity}</span>
              <button class="mbg-qty-btn" data-action="inc" aria-label="Increase quantity">&plus;</button>
            </div>
          </div>
          <div class="mbg-cart-item-right">
            <div class="mbg-cart-line-total">$${(item.price * item.quantity).toFixed(2)}</div>
            <button class="mbg-cart-item-remove" data-action="remove">Remove</button>
          </div>
        </div>
      `
        )
        .join("");
    }

    totalEl.textContent = `$${cartTotal(cart).toFixed(2)}`;
    checkoutBtn.disabled = cart.length === 0;
  }

  itemsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = btn.closest(".mbg-cart-item");
    const id = row.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    if (action === "inc") updateQuantity(id, 1);
    if (action === "dec") updateQuantity(id, -1);
    if (action === "remove") removeItem(id);
  });

  launcher.addEventListener("click", () => {
    renderCart();
    openDrawer();
  });
  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  checkoutBtn.addEventListener("click", async () => {
    const cart = getCart();
    if (!cart.length) return;

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    errorEl.style.display = "none";

    if (!name || !phone) {
      errorEl.textContent = "Please enter your name and phone number so we can reach you when it's ready.";
      errorEl.style.display = "block";
      (name ? phoneInput : nameInput).focus();
      return;
    }

    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify({ name, phone }));
    } catch (e) {
      /* ignore */
    }

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Redirecting…";

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          items: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
          customerName: name,
          customerPhone: phone,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Something went wrong starting checkout.");
      }

      const data = await res.json();
      if (!data.checkoutUrl) throw new Error("No checkout URL returned.");

      // Cart is cleared on redirect — the order now lives with Stripe/backend.
      saveCart([]);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      errorEl.textContent = err.message || "Something went wrong. Please try again or call us.";
      errorEl.style.display = "block";
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Checkout";
    }
  });

  // ---- Wire up "Add" buttons on any dish-card with data-id --------------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-cart-btn");
    if (!btn) return;
    const card = btn.closest("[data-id]");
    if (!card) return;

    const id = card.getAttribute("data-id");
    const name = card.getAttribute("data-name");
    const price = parseFloat(card.getAttribute("data-price"));
    if (!id || Number.isNaN(price)) return;

    addToCart(id, name, price);

    btn.textContent = "Added";
    btn.classList.add("added");
    setTimeout(() => {
      btn.textContent = "Add";
      btn.classList.remove("added");
    }, 1200);
  });

  function addQuantity(id, name, price, quantity) {
    const cart = getCart();
    const existing = cart.find((i) => i.id === id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id, name, price, quantity });
    }
    saveCart(cart);
    renderCart();
  }

  // ---- Public API — lets other scripts (e.g. chat-widget.js) add items --
  // Call window.MBGCart.addItems([{ id, name, price, quantity }, ...])
  // whenever the chat agent's add_to_cart tool returns a cartAction.
  window.MBGCart = {
    addItems(actions) {
      if (!Array.isArray(actions) || !actions.length) return;
      actions.forEach((action) => {
        if (!action || !action.id) return;
        const quantity = Math.max(1, parseInt(action.quantity, 10) || 1);
        addQuantity(action.id, action.name, action.price, quantity);
      });
    },
    open: openDrawer,
  };

  renderCart();
})();

(function () {
  const guestCartKey = 'monarchcarbon_guest_cart_v1';
  const newsletterKey = 'monarchcarbon_newsletter_signup_v1';
  const newsletterDismissedKey = 'monarchcarbon_newsletter_dismissed_v1';
  const newsletterShownKey = 'monarchcarbon_newsletter_shown_v1';
  const body = document.body;
  const products = window.MONARCH_PRODUCTS || [];
  const config = window.MONARCH_CONFIG || {};
  let firebaseReady = false;
  let auth = null;
  let db = null;
  let googleProvider = null;
  let currentUser = null;
  let cartItems = [];
  let isCheckingOut = false;
  let persistenceReady = false;
  let pendingNewsletterSignup = null;

  function initFirebase() {
    const app = window.MONARCH_FIREBASE;
    if (!app) return false;
    auth = app.auth;
    db = app.db;
    googleProvider = app.googleProvider;
    firebaseReady = true;
    return true;
  }

  function localCartKeyForUser(uid) {
    return uid ? `${guestCartKey}__${uid}` : guestCartKey;
  }

  function getGuestCart(uid = null) {
    try {
      return JSON.parse(localStorage.getItem(localCartKeyForUser(uid)) || '[]');
    } catch {
      return [];
    }
  }

  function setGuestCart(items, uid = null) {
    localStorage.setItem(localCartKeyForUser(uid), JSON.stringify(items));
  }

  function getNewsletterSignup() {
    try {
      return JSON.parse(localStorage.getItem(newsletterKey) || 'null');
    } catch {
      return null;
    }
  }

  function setNewsletterSignup(record) {
    localStorage.setItem(newsletterKey, JSON.stringify(record));
    localStorage.removeItem(newsletterDismissedKey);
  }

  function hasNewsletterSignup() {
    const signup = getNewsletterSignup();
    return Boolean(signup && signup.discountUnlocked);
  }

  function productBySlug(slug) {
    return products.find((item) => item.slug === slug);
  }

  function itemKey(item) {
    return `${item.slug}__${item.colour || 'default'}__${item.model || 'default'}`;
  }

  function mergeItems(base, incoming) {
    const map = new Map();
    [...base, ...incoming].forEach((item) => {
      const key = itemKey(item);
      const existing = map.get(key);
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        map.set(key, { ...item, quantity: item.quantity || 1 });
      }
    });
    return [...map.values()];
  }

  async function loadUserCart(uid) {
    const snap = await db.collection('carts').doc(uid).get();
    return snap.exists ? (snap.data().items || []) : [];
  }

  async function saveUserCart(uid, items) {
    await db.collection('carts').doc(uid).set({
      items,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async function loadCart() {
    try {
      if (currentUser && firebaseReady) {
        cartItems = await loadUserCart(currentUser.uid);
      } else {
        cartItems = getGuestCart();
      }
    } catch {
      cartItems = getGuestCart(currentUser ? currentUser.uid : null);
    }
    renderCartEverywhere();
  }

  async function persistCart() {
    try {
      if (currentUser && firebaseReady) {
        await saveUserCart(currentUser.uid, cartItems);
        setGuestCart(cartItems, currentUser.uid);
      } else {
        setGuestCart(cartItems);
      }
    } catch {
      setGuestCart(cartItems, currentUser ? currentUser.uid : null);
      authMessage('Cloud cart save failed. Saved locally for now.', true);
    }
    renderCartEverywhere();
  }

  async function addToCart(item) {
    try {
      cartItems = mergeItems(cartItems, [item]);
      await persistCart();
      openCartDrawer();
    } catch {
      authMessage('Could not add item to cart. Please try again.', true);
    }
  }

  async function updateQty(index, delta) {
    const next = [...cartItems];
    const item = next[index];
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) next.splice(index, 1);
    cartItems = next;
    await persistCart();
  }

  async function removeItem(index) {
    const next = [...cartItems];
    next.splice(index, 1);
    cartItems = next;
    await persistCart();
  }

  function subtotal(items) {
    return items.reduce((sum, item) => sum + ((item.unitAmount || 0) * (item.quantity || 1)), 0);
  }

  function promotionDiscount(items) {
    const unitPrices = [];
    items.forEach((item) => {
      const quantity = Math.max(0, Number(item.quantity) || 0);
      for (let i = 0; i < quantity; i += 1) {
        unitPrices.push(Number(item.unitAmount) || 0);
      }
    });
    const freeUnits = Math.floor(unitPrices.length / 3);
    if (!freeUnits) return 0;
    return unitPrices
      .sort((a, b) => a - b)
      .slice(0, freeUnits)
      .reduce((sum, amount) => sum + amount, 0);
  }

  function currency(amount) {
    return `$${amount.toFixed(2)}`;
  }

  function parseAmount(label) {
    return Number(String(label).replace(/[^0-9.]/g, '')) || 0;
  }

  function explainAuthError(error) {
    const code = error && error.code ? error.code : '';
    if (code === 'auth/unauthorized-domain') return 'Domain is not authorized in Firebase Auth settings.';
    if (code === 'auth/operation-not-allowed') return 'This sign-in method is disabled in Firebase.';
    if (code === 'auth/popup-blocked') return 'Popup blocked. Please allow popups and retry.';
    return error && error.message ? error.message : 'Authentication failed.';
  }

  function createChrome() {
    if (document.getElementById('auth-modal')) return;

    if (!document.getElementById('promo-marquee')) {
      const promo = document.createElement('div');
      promo.id = 'promo-marquee';
      promo.className = 'promo-marquee';
      promo.setAttribute('aria-label', 'Launch offer: buy two items, get one free, with free tracked shipping');
      promo.innerHTML = `
        <div class="promo-marquee-track">
          <div class="promo-marquee-group">
            <span>Launch offer: buy 2, get 1 free</span>
            <span>Free tracked shipping</span>
            <span>Secure Stripe checkout</span>
            <span>Premium carbon fibre everyday carry</span>
          </div>
          <div class="promo-marquee-group" aria-hidden="true">
            <span>Launch offer: buy 2, get 1 free</span>
            <span>Free tracked shipping</span>
            <span>Secure Stripe checkout</span>
            <span>Premium carbon fibre everyday carry</span>
          </div>
        </div>
      `;
      document.body.prepend(promo);
    }

    const navWrap = document.querySelector('.nav-wrap');
    if (navWrap && !document.getElementById('nav-user-actions')) {
      const actions = document.createElement('div');
      actions.id = 'nav-user-actions';
      actions.className = 'nav-user-actions';
      actions.innerHTML = `
        <a class="nav-link cart-link" href="cart.html" aria-label="Open cart">Cart <span id="cart-count" class="cart-count">0</span></a>
        <button id="auth-trigger" class="button button-secondary nav-auth-button" type="button">Sign In</button>
      `;
      navWrap.appendChild(actions);
    }

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'overlay-shell hidden';
    modal.innerHTML = `
      <div class="overlay-backdrop" data-close-auth></div>
      <div class="overlay-panel auth-panel">
        <button class="overlay-close" type="button" data-close-auth>&times;</button>
        <p class="eyebrow">Account</p>
        <h2>Sign in or create an account</h2>
        <div id="auth-message" class="auth-message"></div>
        <form id="auth-form" class="auth-form">
          <label>Email</label>
          <input id="auth-email" type="email" required placeholder="you@example.com" />
          <label>Password</label>
          <input id="auth-password" type="password" required placeholder="Minimum 6 characters" />
          <div class="auth-actions-row">
            <button class="button button-primary" type="submit">Sign In</button>
            <button class="button button-secondary" type="button" id="signup-button">Create Account</button>
          </div>
          <button class="text-link inline-link" type="button" id="reset-password-button">Forgot password?</button>
        </form>
        <div class="auth-divider"><span>or</span></div>
        <button id="google-signin" class="button button-secondary auth-google" type="button">Continue with Google</button>
      </div>
    `;

    const newsletter = document.createElement('div');
    newsletter.id = 'newsletter-modal';
    newsletter.className = 'overlay-shell newsletter-shell hidden';
    newsletter.setAttribute('role', 'dialog');
    newsletter.setAttribute('aria-modal', 'true');
    newsletter.setAttribute('aria-labelledby', 'newsletter-title');
    newsletter.innerHTML = `
      <div class="overlay-backdrop" data-close-newsletter></div>
      <div class="overlay-panel newsletter-panel">
        <div class="newsletter-step" data-newsletter-step="email">
          <p class="eyebrow">Join Us</p>
          <h2 id="newsletter-title">Join the launch list</h2>
          <p class="newsletter-copy">Get product drops, launch offers, and restock updates from CARBON MONARCH.</p>
          <form id="newsletter-email-form" class="newsletter-form">
            <label for="newsletter-email">Email</label>
            <input id="newsletter-email" type="email" required autocomplete="email" placeholder="you@example.com" />
            <label class="newsletter-consent">
              <input id="newsletter-consent" type="checkbox" required />
              <span>I agree to receive marketing emails from CARBON MONARCH.</span>
            </label>
            <button class="button button-primary" type="submit">Next</button>
          </form>
        </div>
        <div class="newsletter-step hidden" data-newsletter-step="phone">
          <p class="eyebrow">Almost Done</p>
          <h2>Add your phone number</h2>
          <p class="newsletter-copy">Add your number if you want SMS updates for launches and order-related news.</p>
          <form id="newsletter-phone-form" class="newsletter-form">
            <label for="newsletter-phone">Phone number</label>
            <input id="newsletter-phone" type="tel" required autocomplete="tel" placeholder="+61 400 000 000" />
            <button class="button button-primary" type="submit">Join List</button>
          </form>
        </div>
        <div id="newsletter-message" class="newsletter-message"></div>
        <button class="newsletter-dismiss" type="button" data-close-newsletter>Not now</button>
      </div>
    `;

    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'overlay-shell hidden';
    drawer.innerHTML = `
      <div class="overlay-backdrop" data-close-cart></div>
      <aside class="overlay-panel cart-panel">
        <button class="overlay-close" type="button" data-close-cart>&times;</button>
        <p class="eyebrow">Saved Cart</p>
        <h2>Your cart</h2>
        <div id="cart-drawer-body" class="cart-body"></div>
      </aside>
    `;

    document.body.appendChild(newsletter);
    document.body.appendChild(modal);
    document.body.appendChild(drawer);

    document.getElementById('auth-trigger')?.addEventListener('click', openAuthModal);
    document.querySelectorAll('[data-close-auth]').forEach((el) => el.addEventListener('click', closeAuthModal));
    document.querySelectorAll('[data-close-cart]').forEach((el) => el.addEventListener('click', closeCartDrawer));
    document.querySelectorAll('[data-close-newsletter]').forEach((el) => el.addEventListener('click', closeNewsletterModal));
    document.getElementById('auth-form')?.addEventListener('submit', handleSignIn);
    document.getElementById('signup-button')?.addEventListener('click', handleSignUp);
    document.getElementById('google-signin')?.addEventListener('click', handleGoogleSignIn);
    document.getElementById('reset-password-button')?.addEventListener('click', handlePasswordReset);
    document.getElementById('newsletter-email-form')?.addEventListener('submit', handleNewsletterEmailStep);
    document.getElementById('newsletter-phone-form')?.addEventListener('submit', handleNewsletterPhoneStep);
  }

  function authMessage(message, error) {
    const target = document.getElementById('auth-message');
    if (!target) return;
    target.innerHTML = message || '';
    target.className = `auth-message ${error ? 'is-error' : 'is-ok'}`;
  }

  function openAuthModal() { document.getElementById('auth-modal')?.classList.remove('hidden'); }
  function closeAuthModal() { document.getElementById('auth-modal')?.classList.add('hidden'); }
  function openCartDrawer() { document.getElementById('cart-drawer')?.classList.remove('hidden'); }
  function closeCartDrawer() { document.getElementById('cart-drawer')?.classList.add('hidden'); }
  function shouldShowNewsletterModal() {
    if (body.dataset.page !== 'home') return false;
    if (sessionStorage.getItem(newsletterShownKey)) return false;
    return true;
  }

  function markNewsletterShown() {
    sessionStorage.setItem(newsletterShownKey, '1');
  }

  function openNewsletterModal() {
    if (!shouldShowNewsletterModal()) return;
    const modal = document.getElementById('newsletter-modal');
    if (!modal) return;
    markNewsletterShown();
    modal.classList.remove('hidden');
    window.requestAnimationFrame(() => modal.classList.add('is-visible'));
  }

  function closeNewsletterModal() {
    const modal = document.getElementById('newsletter-modal');
    if (!modal) return;
    modal.classList.remove('is-visible');
    window.setTimeout(() => modal.classList.add('hidden'), 280);
  }

  function newsletterMessage(message, error) {
    const target = document.getElementById('newsletter-message');
    if (!target) return;
    target.textContent = message || '';
    target.className = `newsletter-message ${error ? 'is-error' : 'is-ok'}`;
  }

  function showNewsletterStep(step) {
    document.querySelectorAll('[data-newsletter-step]').forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset.newsletterStep !== step);
    });
    newsletterMessage('', false);
  }

  function maybeOpenNewsletterModal() {
    if (!shouldShowNewsletterModal()) return;
    window.setTimeout(openNewsletterModal, 700);
  }

  window.openNewsletterModal = openNewsletterModal;
  window.maybeOpenNewsletterModal = maybeOpenNewsletterModal;

  function handleNewsletterEmailStep(event) {
    event.preventDefault();
    const email = document.getElementById('newsletter-email')?.value.trim();
    const consent = document.getElementById('newsletter-consent')?.checked;
    if (!email || !consent) {
      newsletterMessage('Enter your email and agree to receive emails before continuing.', true);
      return;
    }
    pendingNewsletterSignup = { email, emailConsent: true };
    showNewsletterStep('phone');
    document.getElementById('newsletter-phone')?.focus();
  }

  async function handleNewsletterPhoneStep(event) {
    event.preventDefault();
    const phone = document.getElementById('newsletter-phone')?.value.trim();
    if (!pendingNewsletterSignup || !phone) {
      newsletterMessage('Enter your phone number to join the launch list.', true);
      return;
    }

    const button = event.submitter;
    if (button) {
      button.disabled = true;
      button.dataset.originalLabel = button.dataset.originalLabel || button.textContent;
      button.textContent = 'Saving...';
    }

    const createdAtClient = new Date().toISOString();
    const record = {
      ...pendingNewsletterSignup,
      phone,
      discountUnlocked: true,
      discountLabel: 'Launch list joined',
      ownerEmail: config.newsletterOwnerEmail || 'officialcarbonmonarch@gmail.com',
      sourcePage: window.location.pathname || '/',
      createdAtClient
    };

    try {
      await saveNewsletterSignup(record);
      setNewsletterSignup(record);
      applyNewsletterState();
      newsletterMessage('Saved. You are on the CARBON MONARCH launch list.', false);
      document.querySelector('[data-newsletter-step="phone"]').innerHTML = `
        <p class="eyebrow">Saved</p>
        <h2>You are on the list</h2>
        <a class="button button-primary" href="shop.html">Shop Now</a>
      `;
      window.setTimeout(() => document.getElementById('newsletter-modal')?.classList.add('hidden'), 1700);
    } catch (error) {
      setNewsletterSignup(record);
      applyNewsletterState();
      newsletterMessage('Saved on this device. Cloud storage needs Firebase write permission for newsletterSignups.', true);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalLabel || 'Join List';
      }
    }
  }

  async function saveNewsletterSignup(record) {
    if (!firebaseReady || !db || !window.firebase) return;
    await db.collection('newsletterSignups').add({
      ...record,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function applyNewsletterState() {
    body.classList.toggle('newsletter-discount-active', hasNewsletterSignup());
  }

  async function ensurePersistence() {
    if (!firebaseReady || persistenceReady) return;
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      persistenceReady = true;
    } catch {}
  }

  async function handleSignIn(event) {
    event.preventDefault();
    if (!firebaseReady) return authMessage('Firebase is not ready yet.', true);
    await ensurePersistence();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      closeAuthModal();
      window.location.href = 'index.html';
    } catch (error) {
      authMessage(explainAuthError(error), true);
    }
  }

  async function handleSignUp() {
    if (!firebaseReady) return authMessage('Firebase is not ready yet.', true);
    await ensurePersistence();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      closeAuthModal();
      window.location.href = 'index.html';
    } catch (error) {
      authMessage(explainAuthError(error), true);
    }
  }

  async function handleGoogleSignIn() {
    if (!firebaseReady) return authMessage('Firebase is not ready yet.', true);
    await ensurePersistence();
    try {
      await auth.signInWithPopup(googleProvider);
      closeAuthModal();
      window.location.href = 'index.html';
    } catch (error) {
      if (error && error.code === 'auth/popup-blocked') {
        await auth.signInWithRedirect(googleProvider);
        return;
      }
      authMessage(explainAuthError(error), true);
    }
  }

  async function handlePasswordReset() {
    if (!firebaseReady) return authMessage('Firebase is not ready yet.', true);
    const email = document.getElementById('auth-email').value.trim();
    if (!email) return authMessage('Enter your email first.', true);
    try {
      await auth.sendPasswordResetEmail(email);
      authMessage(`Reset email requested for ${email}. Check inbox and spam.`, false);
    } catch (error) {
      authMessage(explainAuthError(error), true);
    }
  }

  async function handleLogout() {
    if (firebaseReady) {
      try { await auth.signOut(); } catch {}
    }
    closeAuthModal();
    window.location.href = 'index.html';
  }

  function renderAuthButton() {
    const trigger = document.getElementById('auth-trigger');
    if (!trigger) return;
    const replacement = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(replacement, trigger);
    if (currentUser) {
      replacement.textContent = currentUser.email ? currentUser.email.split('@')[0] : 'Account';
      replacement.classList.add('is-authenticated');
      replacement.addEventListener('click', openAccountMenu);
    } else {
      replacement.textContent = 'Sign In';
      replacement.classList.remove('is-authenticated');
      replacement.addEventListener('click', openAuthModal);
    }
  }

  function openAccountMenu() {
    authMessage(currentUser ? `Signed in as ${currentUser.email}. <button id="logout-button" class="text-link inline-link" type="button">Log out</button>` : '', false);
    document.getElementById('logout-button')?.addEventListener('click', handleLogout, { once: true });
    openAuthModal();
  }

  async function startCheckout(itemsOverride) {
    if (isCheckingOut) return;
    const items = itemsOverride || cartItems;
    if (!items.length) return;
    isCheckingOut = true;
    setCheckoutBusy(true);
    renderCheckoutStatus('', false);
    try {
      const response = await fetch(config.checkoutEndpoint || '/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const raw = await response.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      if (!response.ok || !data || !data.url) {
        throw new Error((data && data.error) || raw || 'Unable to start checkout.');
      }
      window.location.href = data.url;
    } catch (error) {
      renderCheckoutStatus(error.message || 'Unable to start checkout.', true);
    } finally {
      isCheckingOut = false;
      setCheckoutBusy(false);
    }
  }

  function setCheckoutBusy(isBusy) {
    document.querySelectorAll('[data-checkout-all],[data-checkout-item]').forEach((el) => {
      if (el.tagName === 'BUTTON') el.disabled = isBusy;
      if (isBusy) {
        el.dataset.originalLabel = el.dataset.originalLabel || el.textContent;
        el.textContent = 'Loading...';
      } else if (el.dataset.originalLabel) {
        el.textContent = el.dataset.originalLabel;
      }
    });
  }

  function renderCheckoutStatus(message, error) {
    const targets = document.querySelectorAll('[data-checkout-status]');
    targets.forEach((target) => {
      target.textContent = message || '';
      target.className = `auth-message ${error ? 'is-error' : 'is-ok'}`;
    });
  }

  function renderCartEverywhere() {
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const countTarget = document.getElementById('cart-count');
    if (countTarget) countTarget.textContent = String(count);

    const drawerBody = document.getElementById('cart-drawer-body');
    if (drawerBody) drawerBody.innerHTML = cartMarkup(false);

    const cartPage = document.getElementById('cart-page');
    if (cartPage) cartPage.innerHTML = cartMarkup(true);

    bindCartControls();
    applyCartStatusFromUrl();
  }

  function cartMarkup(fullPage) {
    if (!cartItems.length) {
      return `
        <div class="empty-cart">
          <p>Your cart is empty.</p>
          <a class="button button-primary" href="shop.html">Browse Products</a>
        </div>
      `;
    }

    const rawSubtotal = subtotal(cartItems);
    const discount = promotionDiscount(cartItems);
    const total = Math.max(0, rawSubtotal - discount);
    const newsletterRow = hasNewsletterSignup()
      ? '<div class="cart-summary-row newsletter-summary-row"><span>Launch list</span><strong>Joined</strong></div>'
      : '';
    const rows = cartItems.map((item, index) => `
      <article class="cart-item">
        <span class="cart-item-image">
          ${item.image ? `<img src="${encodeURI(item.image)}" alt="${item.name}" loading="lazy" />` : ''}
        </span>
        <div>
          <h3>${item.name}</h3>
          <p>${item.colour || 'Standard'} &middot; ${item.model || 'One size'} &middot; ${item.priceLabel}</p>
        </div>
        <div class="cart-item-controls">
          <div class="qty-row">
            <button type="button" data-cart-dec="${index}">&minus;</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-inc="${index}">+</button>
          </div>
          <strong>${currency((item.unitAmount || 0) * (item.quantity || 1))}</strong>
          <div class="cart-item-action-buttons">
            <button type="button" class="button button-primary small-button" data-checkout-item="${index}">Check Out</button>
            <button type="button" class="text-link remove-link" data-cart-remove="${index}">Remove</button>
          </div>
        </div>
      </article>
    `).join('');

    return `
      <div class="cart-items-wrap">${rows}</div>
      <div class="cart-summary-box">
        <div class="cart-summary-row"><span>Subtotal</span><strong>${currency(rawSubtotal)}</strong></div>
        <div class="cart-summary-row promo-summary-row"><span>Buy 2 get 1 free</span><strong>-${currency(discount)}</strong></div>
        ${newsletterRow}
        <div class="cart-summary-row"><span>Shipping</span><strong>Free</strong></div>
        <div class="cart-summary-row cart-total-row"><span>Total</span><strong>${currency(total)}</strong></div>
        <p class="price-note">Tracked shipping is included. For every 3 items in your cart, the lowest-priced item is free.</p>
        <div data-checkout-status class="auth-message"></div>
        <div class="cart-summary-actions">
          <button type="button" class="button button-primary" data-checkout-all>Check Out</button>
          ${fullPage ? '' : '<a class="button button-secondary" href="cart.html">Open Cart Page</a>'}
          <a class="button button-secondary" href="shop.html">Continue Shopping</a>
        </div>
      </div>
    `;
  }

  function bindCartControls() {
    document.querySelectorAll('[data-checkout-all]').forEach((button) => button.onclick = () => startCheckout());
    document.querySelectorAll('[data-checkout-item]').forEach((button) => button.onclick = () => {
      const index = Number(button.dataset.checkoutItem);
      const item = cartItems[index];
      if (item) startCheckout([item]);
    });
  }

  function bindGlobalCartDelegates() {
    if (window.__MONARCH_CART_DELEGATES_BOUND__) return;
    window.__MONARCH_CART_DELEGATES_BOUND__ = true;

    document.addEventListener('click', (event) => {
      const inc = event.target.closest('[data-cart-inc]');
      if (inc) return updateQty(Number(inc.dataset.cartInc), 1);
      const dec = event.target.closest('[data-cart-dec]');
      if (dec) return updateQty(Number(dec.dataset.cartDec), -1);
      const remove = event.target.closest('[data-cart-remove]');
      if (remove) return removeItem(Number(remove.dataset.cartRemove));
    });
  }

  function buildCurrentProductItem() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || 'phone-case-iphone-forged';
    const product = productBySlug(slug);
    if (!product) return null;
    const deviceSelect = document.getElementById('device-select');
    const model = deviceSelect ? deviceSelect.value : 'One size';
    const selectedColor = params.get('color') || product.colour || 'Standard';
    const colorKey = String(selectedColor).toLowerCase();
    return {
      slug: product.slug,
      type: product.type,
      name: product.name,
      brand: product.brand || '',
      material: product.material,
      materialLabel: product.materialLabel,
      colour: selectedColor,
      image: (product.colorImages && (product.colorImages[colorKey] || product.colorImages[selectedColor])) || product.image || '',
      description: product.description,
      quantity: 1,
      model,
      priceLabel: product.price,
      unitAmount: parseAmount(product.price)
    };
  }

  function buildProductOptionItem(slug) {
    const product = productBySlug(slug);
    if (!product) return null;
    return {
      slug: product.slug,
      type: product.type,
      name: product.name,
      brand: product.brand || '',
      material: product.material,
      materialLabel: product.materialLabel,
      colour: product.colour || 'Standard',
      image: product.image || (product.colorImages && Object.values(product.colorImages)[0]) || '',
      description: product.description,
      quantity: 1,
      model: product.type === 'phone-case' ? (product.models || [])[0] || 'One size' : product.type === 'card-holder' ? (product.mechanisms || [])[0] || 'Clip' : 'One size',
      priceLabel: product.price,
      unitAmount: parseAmount(product.price)
    };
  }

  function recommendedBundleProducts(currentSlug) {
    const priority = ['card-holder-carbon-weave', 'key-holder-forged', 'card-holder-forged-carbon', 'key-holder-carbon-weave', 'phone-case-samsung-forged'];
    const preferred = priority
      .map((slug) => productBySlug(slug))
      .filter((product) => product && product.slug !== currentSlug);
    const remaining = products.filter((product) => product.slug !== currentSlug && !preferred.some((item) => item.slug === product.slug));
    return [...preferred, ...remaining];
  }

  function productOptionImage(product) {
    return product.image || (product.colorImages && Object.values(product.colorImages)[0]) || '';
  }

  function buildBundleItems() {
    const current = buildCurrentProductItem();
    if (!current) return [];
    const extraSlugs = [...document.querySelectorAll('[data-bundle-select]')]
      .map((select) => select.value)
      .filter(Boolean);
    return [current, ...extraSlugs.map(buildProductOptionItem).filter(Boolean)];
  }

  function renderBundlePicker(actions) {
    if (document.getElementById('bundle-builder')) return;
    const currentItem = buildCurrentProductItem();
    if (!currentItem || products.length < 2) return;

    const recommended = recommendedBundleProducts(currentItem.slug);
    const optionMarkup = recommended
      .map((product) => `<option value="${product.slug}">${product.name} - ${product.price}</option>`)
      .join('');
    const firstRecommendation = recommended[0] || products.find((product) => product.slug !== currentItem.slug);
    const secondRecommendation = recommended[1] || firstRecommendation;
    const recommendationCard = (index, product) => `
      <label class="bundle-recommendation">
        <span class="bundle-number">${index}</span>
        <span class="bundle-photo">
          ${productOptionImage(product) ? `<img src="${encodeURI(productOptionImage(product))}" alt="${product.name}" loading="lazy" />` : ''}
        </span>
        <span class="bundle-product-copy">
          <small>Recommended add-on</small>
          <strong data-bundle-name="${index}">${product.name}</strong>
          <em data-bundle-price="${index}">${product.price}</em>
        </span>
        <select data-bundle-select data-bundle-index="${index}">${optionMarkup}</select>
      </label>
    `;
    const panel = document.createElement('div');
    panel.id = 'bundle-builder';
    panel.className = 'bundle-builder';
    panel.innerHTML = `
      <div class="bundle-copy">
        <p class="deal-kicker">Buy 2 get 1 free</p>
        <h2>Add 2 items, get 1 item free</h2>
        <p>Pick two recommended add-ons with this product and the deal applies automatically.</p>
      </div>
      <div class="bundle-select-grid">
        ${recommendationCard(2, firstRecommendation)}
        ${recommendationCard(3, secondRecommendation)}
      </div>
      <div class="bundle-total" data-bundle-total></div>
      <div class="bundle-actions">
        <button class="button button-primary" type="button" data-add-bundle>Add Deal to Cart</button>
        <button class="button button-secondary" type="button" data-buy-bundle>Buy Deal Now</button>
      </div>
    `;
    actions.insertAdjacentElement('afterend', panel);
    const selects = [...panel.querySelectorAll('[data-bundle-select]')];
    if (selects[0] && firstRecommendation) selects[0].value = firstRecommendation.slug;
    if (selects[1] && secondRecommendation) selects[1].value = secondRecommendation.slug;

    const updateBundleTotal = () => {
      const items = buildBundleItems();
      const before = subtotal(items);
      const discount = promotionDiscount(items);
      const after = Math.max(0, before - discount);
      const target = panel.querySelector('[data-bundle-total]');
      selects.forEach((select) => {
        const product = productBySlug(select.value);
        const index = select.dataset.bundleIndex;
        const name = panel.querySelector(`[data-bundle-name="${index}"]`);
        const price = panel.querySelector(`[data-bundle-price="${index}"]`);
        const image = select.closest('.bundle-recommendation')?.querySelector('.bundle-photo');
        if (name && product) name.textContent = product.name;
        if (price && product) price.textContent = product.price;
        if (image && product) {
          const src = productOptionImage(product);
          image.innerHTML = src ? `<img src="${encodeURI(src)}" alt="${product.name}" loading="lazy" />` : '';
        }
      });
      if (target) target.innerHTML = `<span>${currency(before)}</span><strong>${currency(after)}</strong><small>One item free + free shipping</small>`;
    };

    panel.querySelector('[data-add-bundle]')?.addEventListener('click', async () => {
      const items = buildBundleItems();
      if (items.length < 3) return;
      cartItems = mergeItems(cartItems, items);
      await persistCart();
      openCartDrawer();
    });
    panel.querySelector('[data-buy-bundle]')?.addEventListener('click', async () => {
      const items = buildBundleItems();
      if (items.length < 3) return;
      await startCheckout(items);
    });
    selects.forEach((select) => select.addEventListener('change', updateBundleTotal));
    updateBundleTotal();
  }

  function enhanceProductPage() {
    if (body.dataset.page !== 'product') return;
    const actions = document.querySelector('.product-actions');
    if (!actions) return;

    if (!document.getElementById('add-to-cart-button')) {
      const addButton = document.createElement('button');
      addButton.id = 'add-to-cart-button';
      addButton.className = 'button button-secondary';
      addButton.type = 'button';
      addButton.textContent = 'Add to Cart';
      addButton.addEventListener('click', async () => {
        const item = buildCurrentProductItem();
        if (!item) return;
        await addToCart(item);
      });
      actions.prepend(addButton);
    }

    const buyNow = actions.querySelector('.button-primary');
    if (buyNow) {
      buyNow.setAttribute('href', '#');
      buyNow.textContent = 'Buy Now';
      buyNow.onclick = async (event) => {
        event.preventDefault();
        const item = buildCurrentProductItem();
        if (!item) return;
        await startCheckout([item]);
      };
    }

    renderBundlePicker(actions);
  }

  function watchProductPageActions() {
    if (body.dataset.page !== 'product') return;
    enhanceProductPage();
    const target = document.getElementById('product-detail') || document.body;
    const observer = new MutationObserver(() => {
      if (document.querySelector('.product-actions') && !document.getElementById('add-to-cart-button')) {
        enhanceProductPage();
      }
    });
    observer.observe(target, { childList: true, subtree: true });
    setTimeout(enhanceProductPage, 250);
    setTimeout(enhanceProductPage, 900);
  }

  function applyCartStatusFromUrl() {
    if (body.dataset.page !== 'cart') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      renderCheckoutStatus('Payment completed. Check Stripe for the new order.', false);
    } else if (params.get('checkout') === 'cancelled') {
      renderCheckoutStatus('Checkout cancelled. Your cart is still here.', true);
    }
  }

  async function handleAuthState(user) {
    currentUser = user;
    try {
      if (currentUser) {
        try {
          cartItems = await loadUserCart(currentUser.uid);
        } catch {
          cartItems = getGuestCart(currentUser.uid);
        }
      } else {
        cartItems = getGuestCart();
      }
      renderCartEverywhere();
    } finally {
      renderAuthButton();
    }
  }

  async function init() {
    createChrome();
    applyNewsletterState();
    bindGlobalCartDelegates();
    watchProductPageActions();

    if (!initFirebase()) {
      cartItems = getGuestCart();
      renderCartEverywhere();
      renderAuthButton();
      return;
    }

    await ensurePersistence();
    try { await auth.getRedirectResult(); } catch {}

    auth.onAuthStateChanged(handleAuthState);
    await loadCart();
    renderAuthButton();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', watchProductPageActions);
})();

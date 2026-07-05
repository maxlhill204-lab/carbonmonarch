(function () {
  const products = window.MONARCH_PRODUCTS || [];
  const config = window.MONARCH_CONFIG || {};
  const body = document.body;
  const colourPalette = {
    black: { base: '#1b1d22', glow: '#5f6672' },
    blue: { base: '#2f6dff', glow: '#8bb3ff' },
    green: { base: '#1ea56f', glow: '#79e2b5' },
    purple: { base: '#7c54d9', glow: '#c09cff' },
    gold: { base: '#c79a2f', glow: '#f2cf75' },
    golden: { base: '#c79a2f', glow: '#f2cf75' },
    red: { base: '#c53b4c', glow: '#ff9aa9' },
    silver: { base: '#b7bec9', glow: '#eef3f9' },
    white: { base: '#e6ebf2', glow: '#ffffff' },
    yellow: { base: '#d8b423', glow: '#ffe57c' },
    pink: { base: '#d96aa5', glow: '#ffc0de' },
    standard: { base: '#6d7686', glow: '#cfd6e2' }
  };

  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;
    const currentPage = body.dataset.page || 'home';
    document.querySelectorAll('.site-nav a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const isActive =
        (currentPage === 'home' && href === 'index.html') ||
        (currentPage === 'shop' && href.startsWith('shop.html')) ||
        (currentPage === 'product' && href.startsWith('shop.html')) ||
        (currentPage === 'cart' && href.startsWith('cart.html')) ||
        (currentPage === 'contact' && href.startsWith('contact.html')) ||
        (currentPage === 'sponsors' && href.startsWith('sponsors.html'));
      if (isActive && !link.classList.contains('nav-cta')) link.setAttribute('aria-current', 'page');
    });

    const setOpen = (isOpen) => {
      nav.classList.toggle('is-open', isOpen);
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      body.classList.toggle('nav-open', isOpen);
    };

    toggle.addEventListener('click', () => {
      setOpen(!nav.classList.contains('is-open'));
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  function setupReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }


  function initCinematicScroll() {
    const items = document.querySelectorAll('[data-cinematic-speed]');
    if (!items.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    const update = () => {
      const viewport = window.innerHeight || 1;
      items.forEach((item) => {
        const speed = Number(item.dataset.cinematicSpeed || 0.08);
        const rect = item.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - viewport / 2;
        const y = Math.max(-42, Math.min(42, centerOffset * -speed));
        item.style.setProperty('--cinematic-y', `${y.toFixed(2)}px`);
      });
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  }

  function getTextureClass(material) {
    return material === 'carbon-weave' ? 'weave' : 'forged';
  }

  function getShapeClass(type) {
    if (type === 'card-holder') return 'shape-card-holder';
    if (type === 'key-holder') return 'shape-key-holder';
    return 'shape-phone-case';
  }

  function createProductArtwork(product, large = false) {
    const wrapperClass = large ? 'product-display' : 'product-image';
    if (product.image) {
      const fit = large ? 'contain' : 'cover';
      return `
        <div class="${wrapperClass} ${getTextureClass(product.material)}">
          <img src="${encodeURI(product.image)}" alt="${product.name}" style="width:100%;height:100%;object-fit:${fit};border-radius:inherit;" loading="lazy" />
        </div>
      `;
    }
    return `
      <div class="${wrapperClass} ${getTextureClass(product.material)}">
        <div class="product-shape ${getShapeClass(product.type)}" style="background:
          linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02)),
          radial-gradient(circle at 25% 20%, ${product.accent}55, transparent 24%),
          linear-gradient(140deg, rgba(10,12,18,0.95), rgba(24,28,34,0.92));"></div>
      </div>
    `;
  }

  function productCard(product) {
    const colourPreview = (product.colors || []).slice(0, 5).map((colour) => `
      <span class="mini-colour-dot" style="${getColourDotStyle(colour)}" title="${colour}"></span>
    `).join('');
    return `
      <a class="product-card product-card-link reveal" href="product.html?slug=${encodeURIComponent(product.slug)}&color=${encodeURIComponent(product.colour)}" aria-label="View ${product.name}">
        <span class="product-card-badge">${product.materialLabel}</span>
        ${createProductArtwork(product)}
        <div class="product-content">
          <p class="product-meta">${product.typeLabel} &middot; ${product.colour}</p>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="mini-colour-row" aria-label="Available colours">${colourPreview}<span>${(product.colors || []).length} finishes</span></div>
          <p class="deal-note">${product.dealLabel || 'Launch offer available'}</p>
          <div class="price-row">
            <span class="price-stack"><span class="compare-price">${product.compareAtPrice}</span><span class="price">${product.price}</span></span>
            <span class="text-link">Choose options</span>
          </div>
        </div>
      </a>
    `;
  }

  function compactProductCard(product) {
    return `
      <a class="product-rail-card" href="product.html?slug=${encodeURIComponent(product.slug)}&color=${encodeURIComponent(product.colour)}" aria-label="View ${product.name}">
        ${createProductArtwork(product)}
        <span>
          <small>${product.typeLabel} &middot; ${product.materialLabel}</small>
          <strong>${product.name}</strong>
          <em>${product.price}</em>
        </span>
      </a>
    `;
  }

  function getProductVariant(slug, colour) {
    const product = products.find((item) => item.slug === slug);
    if (!product) return null;
    if (!colour) return product;
    const colorKey = String(colour).toLowerCase();
    return {
      ...product,
      colour,
      image: (product.colorImages && (product.colorImages[colorKey] || product.colorImages[colour])) || product.image
    };
  }

  function renderFeatured() {
    const target = document.getElementById('featured-products');
    if (!target) return;
    const featured = [
      getProductVariant('phone-case-iphone-forged', 'Red'),
      getProductVariant('card-holder-carbon-weave', 'Black'),
      getProductVariant('key-holder-forged', 'Blue')
    ].filter(Boolean);
    target.innerHTML = featured.map(productCard).join('');
    setupReveal();
  }

  function renderCategoryTiles() {
    const target = document.getElementById('category-products');
    if (!target) return;
    const reps = [
      getProductVariant('phone-case-samsung-forged', 'Red'),
      getProductVariant('card-holder-forged-carbon', 'Red'),
      getProductVariant('key-holder-forged', 'Blue')
    ].filter(Boolean);
    target.innerHTML = reps.map(productCard).join('');
    setupReveal();
  }

  function renderShop() {
    const grid = document.getElementById('shop-products');
    const typeFilter = document.getElementById('type-filter');
    const materialFilter = document.getElementById('material-filter');
    const count = document.getElementById('results-count');
    if (!grid || !typeFilter || !materialFilter || !count) return;

    const params = new URLSearchParams(window.location.search);
    ['type', 'material'].forEach((key) => {
      const element = document.getElementById(`${key}-filter`);
      if (element && params.get(key)) element.value = params.get(key);
    });

    const update = () => {
      const filtered = products.filter((product) => {
        const typeMatch = typeFilter.value === 'all' || product.type === typeFilter.value;
        const materialMatch = materialFilter.value === 'all' || product.material === materialFilter.value;
        return typeMatch && materialMatch;
      });
      grid.innerHTML = filtered.map(productCard).join('');
      count.textContent = `${filtered.length} product range${filtered.length === 1 ? '' : 's'}`;
      setupReveal();
    };

    [typeFilter, materialFilter].forEach((select) => select.addEventListener('change', update));
    update();
  }

  function getSiblingColours(product) {
    return (product.colors || []).map((colour) => {
      const key = String(colour).toLowerCase();
      return {
        ...product,
        colour,
        image: (product.colorImages && (product.colorImages[key] || product.colorImages[colour])) || product.image
      };
    });
  }

  function getColourPalette(colour) {
    const key = String(colour || '').toLowerCase();
    return colourPalette[key] || { base: '#7c8798', glow: '#dce4ef' };
  }

  function getColourDotStyle(colour) {
    const palette = getColourPalette(colour);
    return [
      'background:',
      `radial-gradient(circle at 30% 30%, ${palette.glow}, ${palette.base} 62%, #111827 100%)`,
      ';',
      `box-shadow: 0 0 0 1px rgba(255,255,255,0.10), 0 10px 22px ${palette.base}33;`
    ].join('');
  }

  function buildColourSwatches(product) {
    return getSiblingColours(product).map((item) => `
      <a
        class="colour-swatch ${item.colour === product.colour ? 'is-active' : ''}"
        href="product.html?slug=${encodeURIComponent(item.slug)}&color=${encodeURIComponent(item.colour)}"
        aria-label="Select ${item.colour}"
        title="${item.colour}"
      >
        <span class="colour-dot" style="${getColourDotStyle(item.colour)}"></span>
        <span class="colour-name">${item.colour}</span>
      </a>
    `).join('');
  }

  function buildDeviceOptions(product) {
    if (product.type === 'phone-case') {
      const models = product.models || [];
      return models.map((model) => `<option value="${model}">${model}</option>`).join('');
    }
    if (product.type === 'card-holder') {
      const mechs = product.mechanisms || ['Clip'];
      return mechs.map((m) => `<option value="${m}">${m}</option>`).join('');
    }
    return '';
  }

  function getRecommendedProducts(product) {
    const priority = ['card-holder-carbon-weave', 'key-holder-forged', 'card-holder-forged-carbon', 'key-holder-carbon-weave'];
    const preferred = priority
      .map((slug) => products.find((item) => item.slug === slug))
      .filter((item) => item && item.slug !== product.slug);
    const remaining = products.filter((item) => item.slug !== product.slug && !preferred.some((preferredItem) => preferredItem.slug === item.slug));
    return [...preferred, ...remaining].slice(0, 6);
  }

  function productTrustGrid() {
    const icons = {
      carbon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 9 12 22 3 9 12 2Z"/><path d="M3 9h18M8 9l4 13 4-13M8 9l4-7 4 7"/></svg>',
      shipping: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7z"/><path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>',
      checkout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10h12v10H6z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/><path d="M12 14v2"/></svg>',
      options: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4"/><path d="M8 5v4M16 10v4M12 15v4"/></svg>',
      bundle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12v12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M8 13h8"/></svg>'
    };
    const items = [
      [icons.carbon, 'Carbon fibre finish'],
      [icons.shipping, 'Tracked shipping'],
      [icons.checkout, 'Secure Stripe checkout'],
      [icons.options, 'Clear model selection'],
      [icons.bundle, 'Buy 2 get 1 free'],
      [icons.carbon, 'Slim everyday carry']
    ];
    return `
      <div class="product-trust-grid" aria-label="Store benefits">
        ${items.map(([icon, label]) => `
          <div class="trust-item">
            <span aria-hidden="true">${icon}</span>
            <strong>${label}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }

  function productDescriptionPanel(product) {
    const productType = product.typeLabel.toLowerCase();
    return `
      <section class="product-detail-wide product-info-panel reveal">
        <div>
          <p class="eyebrow">Product Description</p>
          <h2>Premium carbon detail for everyday carry</h2>
          <p>${product.description} Each piece is selected for a slim profile, clean hand feel, and a refined carbon finish that matches the rest of the CARBON MONARCH range.</p>
        </div>
        <div>
          <p class="eyebrow">What's In The Box</p>
          <ul class="box-list">
            <li>1 x CARBON MONARCH ${productType}</li>
            <li>Protective packaging</li>
            <li>Selected colour and model or mechanism</li>
          </ul>
        </div>
      </section>
    `;
  }

  function recommendedRail(product) {
    const recommended = getRecommendedProducts(product);
    if (!recommended.length) return '';
    return `
      <section class="product-detail-wide recommended-section reveal">
        <div class="section-heading compact-heading">
          <p class="eyebrow">Recommended</p>
          <h2>Complete the set</h2>
        </div>
        <div class="product-rail" aria-label="Recommended products">
          ${recommended.map(compactProductCard).join('')}
        </div>
      </section>
    `;
  }

  function renderProduct() {
    const target = document.getElementById('product-detail');
    if (!target) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || 'phone-case-iphone-forged';
    const baseProduct = products.find((item) => item.slug === slug) || products[0];
    if (!baseProduct) return;

    const selectedColor = params.get('color') || baseProduct.colour;
    const colorKey = String(selectedColor).toLowerCase();
    const product = {
      ...baseProduct,
      colour: selectedColor,
      image: (baseProduct.colorImages && (baseProduct.colorImages[colorKey] || baseProduct.colorImages[selectedColor])) || baseProduct.image
    };

    document.title = `${product.name} - CARBON MONARCH`;

    target.innerHTML = `
      <div class="product-overview product-detail-wide">
        <div class="product-media">
          ${createProductArtwork(product, true)}
        </div>
        <div class="product-summary">
          <p class="eyebrow">${product.typeLabel} &middot; ${product.materialLabel}${product.brand ? ` &middot; ${product.brand}` : ''}</p>
          <h1>${product.name}</h1>
          <div class="product-badges">
            <span class="badge">Premium carbon fibre finish</span>
            <span class="badge">Lightweight luxury construction</span>
          </div>
          <p>${product.description}</p>
          <div class="product-price-block">
            <p class="deal-kicker">${product.dealLabel || 'Save $10'}</p>
            <p class="price"><span class="compare-price">${product.compareAtPrice}</span> ${product.price}</p>
          </div>
          ${productTrustGrid()}
          <p class="price-note">${product.type === 'key-holder' ? 'Choose your colour below.' : 'Choose a colour below, then pick your model or mechanism.'}</p>

          <div class="selector-grid selector-grid-product">
            <div class="selector-group selector-wide">
              <label>Colour</label>
              <div class="colour-swatch-grid">${buildColourSwatches(product)}</div>
            </div>
            ${product.type === 'key-holder' ? '' : `
            <div class="selector-group ${product.type === 'phone-case' ? '' : 'selector-wide'}">
              <label for="device-select">${product.type === 'phone-case' ? 'Device model' : 'Mechanism'}</label>
              <div class="select-wrap">
                <select id="device-select">${buildDeviceOptions(product)}</select>
              </div>
            </div>
            `}
          </div>

          <div class="product-actions">
            <a class="button button-primary" href="cart.html">Buy Now</a>
            <a class="button button-secondary" href="shop.html?type=${product.type}&material=${product.material}">Back to Collection</a>
          </div>
          <div data-checkout-status class="auth-message checkout-status-inline"></div>
        </div>
      </div>
      ${productDescriptionPanel(product)}
      ${recommendedRail(product)}
    `;
    setupReveal();
  }

  function renderSocials() {
    const containers = document.querySelectorAll('[data-social-links]');
    if (!containers.length || !config.socials) return;
    containers.forEach((container) => {
      container.innerHTML = config.socials.map((item) => `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join('');
    });
  }

  function initTilt() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        const baseX = card.classList.contains('offset-card') ? 1.45 : 3;
        card.style.transform = `translateX(${baseX}rem) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = card.classList.contains('offset-card') ? 'translateX(1.45rem)' : 'translateX(3rem)';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    setupReveal();
    initCinematicScroll();
    initTilt();
    renderSocials();

    switch (body.dataset.page) {
      case 'home':
        renderFeatured();
        renderCategoryTiles();
        break;
      case 'shop':
        renderShop();
        break;
      case 'product':
        renderProduct();
        break;
      default:
        break;
    }
  });
})();

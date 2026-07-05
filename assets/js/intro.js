// Cinematic hero intro: black screen -> logo -> hero background -> content
(function () {
  const HERO_LOGO = 'assets/images/hero/hero-logo.png';

  const TIMING = {
    logoFadeIn: 400,
    logoHold: 1200,
    logoFadeOut: 800,
    heroFadeIn: 100,
    contentFadeIn: 2000,
    overlayFadeOut: 1200
  };

  function getTotalDuration() {
    return (
      TIMING.logoFadeIn +
      TIMING.logoHold +
      TIMING.logoFadeOut +
      TIMING.heroFadeIn +
      TIMING.overlayFadeOut
    );
  }

  function finishIntroImmediately() {
    document.body.classList.remove('intro-mode');
    document.body.classList.add('intro-complete', 'intro-content-visible');
    setupHeroZoomEffect();
  }

  function initIntroSequence() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishIntroImmediately();
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'hero-intro-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="intro-black"></div>
      <img class="intro-logo" src="${HERO_LOGO}" alt="" />
    `;

    document.body.insertBefore(overlay, document.body.firstChild);
    document.body.classList.add('intro-mode');

    let elapsed = TIMING.logoFadeIn;
    window.setTimeout(() => overlay.classList.add('logo-visible'), elapsed);

    elapsed += TIMING.logoHold;
    window.setTimeout(() => overlay.classList.add('logo-exit'), elapsed);

    elapsed += TIMING.logoFadeOut;
    window.setTimeout(() => {
      overlay.classList.add('hero-visible');
      document.body.classList.add('intro-content-visible');
    }, elapsed);

    elapsed += TIMING.heroFadeIn;
    window.setTimeout(() => {
      overlay.classList.add('overlay-exit');
      document.body.classList.remove('intro-mode');
      document.body.classList.add('intro-complete');
    }, elapsed);

    elapsed += TIMING.overlayFadeOut;
    window.setTimeout(() => {
      overlay.remove();
      setupHeroZoomEffect();

    }, elapsed);
  }

  function setupHeroZoomEffect() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    let ticking = false;
    const updateZoom = () => {
      const rect = heroSection.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = Math.max(0, Math.min(1, (viewport - rect.top) / (viewport + rect.height * 0.3)));
      const scale = 1 + progress * 0.15;
      heroSection.style.setProperty('--hero-zoom', scale.toFixed(4));
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateZoom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    updateZoom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntroSequence);
  } else {
    initIntroSequence();
  }
})();

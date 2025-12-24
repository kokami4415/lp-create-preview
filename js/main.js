(() => {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(() => {
    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId) return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // 追従CTA表示（指定画像までスクロールしたら表示）
    const fixedCta = document.getElementById('fixed-cta');
    const triggerImg = document.querySelector('img[src="img/004-80.jpg"], img[src="img/005-80.jpg"]');
    const triggerEl = triggerImg ? (triggerImg.closest('.img-block') || triggerImg) : null;
    let triggerY = 480; // fallback

    function updateTriggerY() {
      if (!triggerEl) return;
      const rect = triggerEl.getBoundingClientRect();
      triggerY = rect.top + window.scrollY;
    }

    function updateFixedCta() {
      if (!fixedCta) return;
      if (window.scrollY >= triggerY) {
        fixedCta.classList.add('show');
      } else {
        fixedCta.classList.remove('show');
      }
    }

    updateTriggerY();
    updateFixedCta();
    window.addEventListener('load', () => {
      updateTriggerY();
      updateFixedCta();
    });
    window.addEventListener('resize', () => {
      updateTriggerY();
      updateFixedCta();
    });
    window.addEventListener('scroll', updateFixedCta, { passive: true });

    // オーバーレイ画像：画像自身が画面中央に来たら1回だけフェードイン
    function setupOneTimeCenterFade(sectionSelector, imgSelector) {
      const section = document.querySelector(sectionSelector);
      const img = document.querySelector(imgSelector);
      if (!section || !img) return;

      let ticking = false;

      function update() {
        ticking = false;
        if (section.classList.contains('is-visible')) return;
        const rect = img.getBoundingClientRect();
        const centerY = window.innerHeight * 0.7;
        const hit = rect.top <= centerY && rect.bottom >= centerY;
        if (hit) {
          section.classList.add('is-visible');
          window.removeEventListener('scroll', requestUpdate);
          window.removeEventListener('resize', requestUpdate);
        }
      }

      function requestUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      }

      update();
      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate);
    }

    // 要素自身：画面中央ライン(デフォルト)に来たら1回だけクラス付与（benefitなど複数要素向け）
    function setupOneTimeViewportLineClass(elSelector, className = 'is-visible', lineRatio = 0.5) {
      const el = document.querySelector(elSelector);
      if (!el) return;

      let ticking = false;

      function update() {
        ticking = false;
        if (el.classList.contains(className)) return;
        const rect = el.getBoundingClientRect();
        const lineY = window.innerHeight * lineRatio;
        const hit = rect.top <= lineY && rect.bottom >= lineY;
        if (hit) {
          el.classList.add(className);
          window.removeEventListener('scroll', requestUpdate);
          window.removeEventListener('resize', requestUpdate);
        }
      }

      function requestUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      }

      update();
      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate);
    }

    setupOneTimeCenterFade('.overlay-x3up', '.overlay-x3up .x3up-overlay');
    setupOneTimeCenterFade('.overlay-logo', '.overlay-logo .logo-overlay');
    setupOneTimeCenterFade('.overlay-eye', '.overlay-eye .eye-overlay');
    setupOneTimeCenterFade('.overlay-brain01', '.overlay-brain01 .brain01-overlay');
    setupOneTimeCenterFade('.overlay-brain02', '.overlay-brain02 .brain02-overlay');
    setupOneTimeCenterFade('.overlay-reading01', '.overlay-reading01 .reading01-overlay');

    // voice01〜04：左右寄せのテキストを、画面中央に来たら1回だけフェードイン
    setupOneTimeViewportLineClass('.overlay-voice01 .voice01-overlay', 'is-visible', 0.5);
    setupOneTimeViewportLineClass('.overlay-voice02 .voice02-overlay', 'is-visible', 0.5);
    setupOneTimeViewportLineClass('.overlay-voice03 .voice03-overlay', 'is-visible', 0.5);
    setupOneTimeViewportLineClass('.overlay-voice04 .voice04-overlay', 'is-visible', 0.5);

    // benefit01〜04：各画像が画面中央に来たら1回だけフェードイン
    setupOneTimeViewportLineClass('.overlay-benefits .benefit01-overlay', 'is-visible', 0.5);
    setupOneTimeViewportLineClass('.overlay-benefits .benefit02-overlay', 'is-visible', 0.5);
    setupOneTimeViewportLineClass('.overlay-benefits .benefit03-overlay', 'is-visible', 0.5);
    setupOneTimeViewportLineClass('.overlay-benefits .benefit04-overlay', 'is-visible', 0.5);

    // アコーディオン（トレーニング）
    function setupAccordion(rootSelector = '.js-accordion') {
      document.querySelectorAll(rootSelector).forEach((root) => {
        const toggle = root.querySelector('.js-accordion-toggle');
        const panel = root.querySelector('.js-accordion-panel');
        if (!toggle || !panel) return;

        // 初期化
        root.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
        panel.style.maxHeight = '0px';

        function refreshPanelHeight() {
          if (!root.classList.contains('is-open')) return;
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        }

        // コンテンツ画像が読み込まれたら高さを更新（途中で切れないように）
        panel.querySelectorAll('img').forEach((img) => {
          img.addEventListener('load', refreshPanelHeight, { once: true });
        });

        function open() {
          root.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
          panel.setAttribute('aria-hidden', 'false');
          refreshPanelHeight();
        }

        function close() {
          // 現在の高さ→0 へ（transition を効かせる）
          panel.style.maxHeight = `${panel.scrollHeight}px`;
          requestAnimationFrame(() => {
            root.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            panel.setAttribute('aria-hidden', 'true');
            panel.style.maxHeight = '0px';
          });
        }

        toggle.addEventListener('click', () => {
          const isOpen = root.classList.contains('is-open');
          if (isOpen) close();
          else open();
        });

        window.addEventListener('resize', () => {
          refreshPanelHeight();
        });
      });
    }

    setupAccordion();

    // 年号更新
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  });
})();



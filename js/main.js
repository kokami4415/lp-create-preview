(() => {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(() => {
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

    // フッターが見えている間は追従CTAを隠す（プライバシーポリシーが押せるように）
    const footerEl = document.querySelector('footer');
    if (fixedCta && footerEl && 'IntersectionObserver' in window) {
      const footerObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          fixedCta.classList.toggle('is-hidden-by-footer', Boolean(entry && entry.isIntersecting));
        },
        {
          root: null,
          threshold: 0.01,
        }
      );
      footerObserver.observe(footerEl);
    }

    // オーバーレイのフェードイン（スクロール監視を一括で軽量化）
    // - IntersectionObserver を使い、画面内の「指定ライン」（例: 0.5=中央, 0.7=下寄り）を横切ったら1回だけ表示
    (function setupOverlayReveal() {
      const canUseIO = 'IntersectionObserver' in window;
      const bandHeightPct = 1; // 画面高さに対して 1% の帯を「トリガーライン」として使う

      function rootMarginForLineRatio(lineRatio) {
        const top = -(lineRatio * 100);
        const bottom = -(100 - lineRatio * 100 - bandHeightPct);
        return `${top}% 0px ${bottom}% 0px`;
      }

      const ioByRatio = new Map();
      const handlerByEl = new WeakMap();

      function observeAtLine(el, lineRatio, onHit) {
        if (!el) return;
        if (canUseIO) {
          let io = ioByRatio.get(lineRatio);
          if (!io) {
            io = new IntersectionObserver(
              (entries, obs) => {
                for (const entry of entries) {
                  if (!entry.isIntersecting) continue;
                  const handler = handlerByEl.get(entry.target);
                  if (handler) handler(entry.target);
                  handlerByEl.delete(entry.target);
                  obs.unobserve(entry.target);
                }
              },
              {
                root: null,
                threshold: 0,
                rootMargin: rootMarginForLineRatio(lineRatio),
              }
            );
            ioByRatio.set(lineRatio, io);
          }
          handlerByEl.set(el, onHit);
          io.observe(el);
          return;
        }

        // Fallback: IntersectionObserver が無い場合は 1つのscroll/resize でまとめてチェック
        fallbackItems.push({ el, lineRatio, onHit });
      }

      const fallbackItems = [];
      let fallbackTicking = false;
      function runFallbackCheck() {
        fallbackTicking = false;
        if (!fallbackItems.length) return;
        for (let i = fallbackItems.length - 1; i >= 0; i--) {
          const item = fallbackItems[i];
          const rect = item.el.getBoundingClientRect();
          const lineY = window.innerHeight * item.lineRatio;
          const hit = rect.top <= lineY && rect.bottom >= lineY;
          if (hit) {
            item.onHit(item.el);
            fallbackItems.splice(i, 1);
          }
        }
      }
      function requestFallbackCheck() {
        if (fallbackTicking) return;
        fallbackTicking = true;
        window.requestAnimationFrame(runFallbackCheck);
      }

      // 0.7ライン：セクションに is-visible を付ける（既存CSSに合わせる）
      [
        '.overlay-x3up',
        '.overlay-logo',
        '.overlay-eye',
        '.overlay-brain01',
        '.overlay-brain02',
        '.overlay-reading01',
      ].forEach((sectionSel) => {
        const section = document.querySelector(sectionSel);
        const img = section ? section.querySelector('.overlay-img') : null;
        if (!section || !img) return;
        observeAtLine(img, 0.7, () => section.classList.add('is-visible'));
      });

      // 0.5ライン：要素自身に is-visible を付ける（benefit/voice）
      [
        '.overlay-voice01 .voice01-overlay',
        '.overlay-voice02 .voice02-overlay',
        '.overlay-voice03 .voice03-overlay',
        '.overlay-voice04 .voice04-overlay',
        '.overlay-benefits .benefit01-overlay',
        '.overlay-benefits .benefit02-overlay',
        '.overlay-benefits .benefit03-overlay',
        '.overlay-benefits .benefit04-overlay',
      ].forEach((elSel) => {
        const el = document.querySelector(elSel);
        if (!el) return;
        observeAtLine(el, 0.5, (target) => target.classList.add('is-visible'));
      });

      if (!canUseIO && fallbackItems.length) {
        runFallbackCheck();
        window.addEventListener('scroll', requestFallbackCheck, { passive: true });
        window.addEventListener('resize', requestFallbackCheck);
      }
    })();

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

        function loadDeferredImages() {
          panel.querySelectorAll('img[data-src]').forEach((img) => {
            const src = img.getAttribute('data-src');
            if (!src) return;

            // 本画像の読み込み完了後に高さを再計算（プレースホルダーのloadでリスナーが消えるのを防ぐ）
            img.addEventListener('load', refreshPanelHeight, { once: true });
            img.setAttribute('src', src);
            img.removeAttribute('data-src');

            // decode可能ならデコード完了後にも再計算（表示途中で切れないように）
            if (typeof img.decode === 'function') {
              img.decode().then(refreshPanelHeight).catch(() => {});
            }
          });
        }

        function open() {
          root.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
          panel.setAttribute('aria-hidden', 'false');
          loadDeferredImages();
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



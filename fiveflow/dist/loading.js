// The host owns the request and calls stop() for success, failure, or cancellation.
// This overlay does not infer or invent a progress percentage.
(() => {
  const translations = {
    en: {
      eyebrow: 'A MOMENT OF DISCOVERY',
      title: 'Finding your\nnext little moment.',
      status: 'Searching with Tavily',
      description: 'Looking for real places and preparing an experience inspired by your elements.',
      patience: 'This can take a little while. Thank you for waiting.',
      cancel: 'Cancel search'
    },
    ja: {
      eyebrow: 'あなただけの体験を探しています',
      title: '今日のひとときを、\n探しています。',
      status: 'Tavilyで検索中',
      description: '実在する場所を探し、あなたの五行に合わせた体験を準備しています。',
      patience: '少しお時間をいただきます。',
      cancel: '検索をキャンセル'
    }
  };
  let overlay;
  let previousFocus;
  let previousOverflow = '';
  let currentLanguage = 'en';

  function makeOverlay() {
    const root = document.createElement('div');
    root.className = 'gogyo-loading';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'gogyo-loading-title');
    root.innerHTML = `<div class="gogyo-loading-sheet">
      <div class="gogyo-loading-top"><span class="gogyo-loading-brand"><b>五</b> GOGYO<span class="gogyo-loading-dot">.</span></span><span class="gogyo-loading-topline" aria-hidden="true">五行 · MEET THE MOMENT</span></div>
      <div class="gogyo-loading-main">
        <div class="gogyo-loading-art" aria-hidden="true">
          <div class="gogyo-loading-orbit gogyo-loading-orbit-outer"></div><div class="gogyo-loading-orbit gogyo-loading-orbit-inner"></div>
          <div class="gogyo-loading-compass"><span>巡</span><small>GO · GYO</small></div>
          <div class="gogyo-loading-elements"><span>木</span><span>火</span><span>土</span><span>金</span><span>水</span></div>
          <span class="gogyo-loading-star star-left">✳</span><span class="gogyo-loading-star star-right">✦</span>
        </div>
        <div class="gogyo-loading-copy"><div class="gogyo-loading-eyebrow"><span></span><b data-loading-text="eyebrow"></b><i aria-hidden="true">寻 · 缘</i></div>
          <h2 id="gogyo-loading-title" data-loading-text="title"></h2>
          <div class="gogyo-loading-status" role="status" aria-live="polite"><span class="gogyo-loading-pulse" aria-hidden="true"></span><strong data-loading-text="status"></strong><span class="gogyo-loading-dots" aria-hidden="true">···</span></div>
          <p data-loading-text="description"></p><small data-loading-text="patience"></small>
          <button type="button" class="gogyo-loading-cancel" data-loading-text="cancel"></button>
        </div>
      </div>
      <div class="gogyo-loading-bottom"><span>WOOD · FIRE · EARTH · METAL · WATER</span><b aria-hidden="true">吉</b></div>
    </div>`;
    root.querySelector('.gogyo-loading-cancel').addEventListener('click', () => document.dispatchEvent(new CustomEvent('gogyo:cancel-search')));
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent('gogyo:cancel-search'));
      }
      // The cancel button is the only focusable control while the dialog is open.
      if (event.key === 'Tab') {
        event.preventDefault();
        root.querySelector('.gogyo-loading-cancel').focus();
      }
    });
    document.body.append(root);
    return root;
  }

  function setLanguage(language) {
    currentLanguage = language === 'ja' ? 'ja' : 'en';
    if (!overlay) return;
    const text = translations[currentLanguage];
    overlay.lang = currentLanguage;
    overlay.querySelectorAll('[data-loading-text]').forEach(node => {
      node.textContent = text[node.dataset.loadingText];
    });
  }

  window.gogyoLoading = {
    start({ language } = {}) {
      if (!overlay) overlay = makeOverlay();
      setLanguage(language);
      if (overlay.hidden) {
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      overlay.hidden = false;
      overlay.querySelector('.gogyo-loading-cancel').focus();
    },
    stop() {
      if (!overlay || overlay.hidden) return;
      const hadFocus = overlay.contains(document.activeElement);
      overlay.hidden = true;
      document.body.style.overflow = previousOverflow;
      if (hadFocus && previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
      previousFocus = null;
    },
    setLanguage
  };
})();

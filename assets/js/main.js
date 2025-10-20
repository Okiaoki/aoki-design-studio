/* =========================================================
   Aoki Design Studio – Landing Page Interactions
   - IntersectionObserver reveal (reduced motion aware)
   - Modal open/close with focus trap
   - Contact form confirm step + Formspree submit
   ========================================================= */

(() => {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xxxxxx'; // ← 実エンドポイントに差し替え

  // ===== Reveal with IntersectionObserver (reduced motion aware) =====
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const revealTargets = document.querySelectorAll('.js-observe, .reveal');
  if (prefersReduced) {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    revealTargets.forEach((el) => observer.observe(el));
  }

  // ===== Modal Controls with focus trap =====
  const modal = document.getElementById('contact-modal');
  const openButtons = document.querySelectorAll('.js-open-modal');
  const previouslyFocused = { el: null };

  const getFocusable = (root) => root?.querySelectorAll(
    'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  ) || [];

  const trapKey = (e) => {
    if (e.key !== 'Tab' || modal?.getAttribute('aria-hidden') !== 'false') return;
    const focusables = [...getFocusable(modal)].filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  let formOpenedAt = 0;
  const openModal = () => {
    if (!modal) return;
    previouslyFocused.el = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    formOpenedAt = Date.now();
    const first = getFocusable(modal)[0];
    setTimeout(() => first?.focus(), 40);
    document.addEventListener('keydown', trapKey);
  };
  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapKey);
    const el = previouslyFocused.el;
    if (el instanceof HTMLElement) el.focus();
  };

  openButtons.forEach((btn) => btn.addEventListener('click', () => {
    try {
      const formEl = document.querySelector('.js-contact-form');
      const confirmEl = document.querySelector('.js-contact-confirm');
      const resultEl = document.querySelector('.js-contact-result');
      if (formEl) formEl.hidden = false;
      if (confirmEl) confirmEl.hidden = true;
      if (resultEl) resultEl.hidden = true;
      formEl?.querySelectorAll('.form-field__error').forEach(el => el.textContent = '');
    } catch(_){}
    openModal();
  }));
  modal?.querySelectorAll('.js-close-modal').forEach((btn) => btn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  }));
  modal?.addEventListener('click', (e) => {
    if ((e.target instanceof HTMLElement) && e.target.dataset.close === 'overlay') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') closeModal();
  });

  // ===== Contact Form Stepper & Validation =====
  const form = document.querySelector('.js-contact-form');
  const confirmView = document.querySelector('.js-contact-confirm');
  const resultView = document.querySelector('.js-contact-result');

  const nameInput = form?.querySelector('#name');
  const emailInput = form?.querySelector('#email');
  const messageInput = form?.querySelector('#message');
  
  const errorFor = (input) => input?.closest('.form-field')?.querySelector('.form-field__error');
  // Clean validator to avoid mojibake in messages
  const validateClean = () => {
    let ok = true;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const set = (input, msg) => {
      const err = input ? errorFor(input) : null;
      if (msg) { err && (err.textContent = msg); ok = false; }
      else { err && (err.textContent = ''); }
    };
    set(nameInput, !nameInput?.value.trim() ? 'お名前を入力してください' : '');
    set(emailInput, !emailInput?.value.trim() ? 'メールアドレスを入力してください' :
      !emailRe.test(emailInput.value.trim()) ? 'メールアドレスの形式が正しくありません' : '');
    set(messageInput, !messageInput?.value.trim() ? 'メッセージを入力してください' : '');
    return ok;
  };
  const validate = () => {
    let ok = true;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const set = (input, msg) => {
      const err = input ? errorFor(input) : null;
      if (msg) { err && (err.textContent = msg); ok = false; }
      else { err && (err.textContent = ''); }
    };

    set(nameInput, !nameInput?.value.trim() ? 'お名前を入力してください。' : '');
    set(emailInput, !emailInput?.value.trim() ? 'メールアドレスを入力してください。' :
      !emailRe.test(emailInput.value.trim()) ? 'メールアドレスの形式が正しくありません。' : '');
    set(messageInput, !messageInput?.value.trim() ? 'メッセージを入力してください。' : '');
    return ok;
  };

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateClean()) return;

    const name = nameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const message = messageInput?.value.trim() || '';

    const setText = (selector, text) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = text;
    };
    setText('.js-confirm-name', name);
    setText('.js-confirm-email', email);
    setText('.js-confirm-message', message);

    form.hidden = true;
    if (confirmView) confirmView.hidden = false;
  });

  document.querySelector('.js-back-to-form')?.addEventListener('click', () => {
    if (confirmView) confirmView.hidden = true;
    if (form) form.hidden = false;
  });

  const showResult = (message, isError = false) => {
    if (!resultView) return;
    const status = resultView.querySelector('.js-result-status');
    const text = isError
      ? '送信に失敗しました。時間をおいて再度お試しください。'
      : '送信ありがとうございます。24時間以内にご連絡いたします。';
    if (status) {
      status.textContent = text;
      status.style.background = isError ? '#241719' : '#112218';
      status.style.color = isError ? '#E5A5A5' : '#8DD7A8';
      status.style.borderColor = isError ? '#3B2225' : '#1E4D33';
    }
    if (confirmView) confirmView.hidden = true;
    resultView.hidden = false;
  };

  const sendBtn = document.querySelector('.js-send');
  sendBtn?.addEventListener('click', async () => {
    if (!nameInput || !emailInput || !messageInput) return;
    // simple anti-spam: very fast submissions are blocked
    if (formOpenedAt && Date.now() - formOpenedAt < 1200) {
      showResult('送信に失敗しました。時間をおいて再度お試しください。', true);
      return;
    }
    sendBtn.setAttribute('disabled', 'true');
    const prevLabel = sendBtn.textContent;
    sendBtn.textContent = '送信中…';

    try {
      const res = await fetch("https://formspree.io/f/xdkwllne", {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          message: messageInput.value.trim(),
          _subject: 'Aoki Design Studio: 新規お問い合わせ',
          _format: 'json'
        })
      });

      if (res.ok) {
        showResult('送信ありがとうございます。24時間以内にご連絡いたします。');
        form?.reset();
      } else {
        showResult('送信に失敗しました。時間をおいて再度お試しください。', true);
      }
    } catch (err) {
      showResult('ネットワークエラーが発生しました。時間をおいてお試しください。', true);
    } finally {
      sendBtn.removeAttribute('disabled');
      sendBtn.textContent = prevLabel || '送信する';
    }
  });

  // Smooth scroll for in-page anchors
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.matches('a[href^="#"]')) {
      const href = t.getAttribute('href');
      if (!href) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // ===== Content upgrades (copy + inserts) =====
  const applyContentUpgrades = () => {
    // Head meta/title
    try{
      document.title = 'Aoki Design Studio — Web Creation & Code';
      const md = document.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', 'LP・コーポレートサイト制作、WordPress構築までワンストップ。Aoki Design Studioは、デザインと言語化とコードであなたのアイデアを形にします。');
    }catch(_){}

    // Skip link
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) skipLink.textContent = 'メインへスキップ';

    // Hero catch copy under the main title
    const heroContent = document.querySelector('.hero__content');
    const heroTitle = heroContent?.querySelector('.hero__title');
    // Fix hero title / studio / CTA
    const titleEl = document.querySelector('.hero__title');
    if (titleEl) titleEl.textContent = 'あなたのアイデアを、デザインとコードで形にします';
    const studio = document.querySelector('.hero__studio');
    if (studio) studio.innerHTML = 'AOKI DESIGN STUDIO — <span class="hero__tagline-en">Web Creation & Code</span>';
    const heroCta = document.querySelector('.hero .btn--primary.js-open-modal');
    if (heroCta) heroCta.textContent = '無料相談はこちら';

    // Remove existing Japanese catch if present
    const oldJa = heroContent?.querySelector('.hero__catch');
    if (oldJa) oldJa.remove();
    // Ensure the English subline exists (but do not add JA line)
    if (heroContent && heroTitle && !heroContent.querySelector('.hero__catch-en')) {
      const pEn = document.createElement('p');
      pEn.className = 'hero__catch-en';
      pEn.textContent = 'We turn your ideas into elegant, functional web experiences.';
      heroTitle.insertAdjacentElement('afterend', pEn);
    }

    // Service cards (titles + descriptions)
    const serviceCards = document.querySelectorAll('.services .service-card');
    const serviceData = [
      { t: 'コーディング', d: 'デザインとロジックを両立した、再現性の高い実装を。' },
      { t: 'LP制作', d: '成果と美しさを両立させる、導線設計とデザイン。' },
      { t: 'WordPress構築', d: '運用のしやすさとパフォーマンスを考慮したCMS設計。' },
    ];
    serviceCards.forEach((card, i) => {
      const title = card.querySelector('.service-card__title');
      const desc = card.querySelector('.service-card__desc');
      if (serviceData[i]) {
        if (title) title.textContent = serviceData[i].t;
        if (desc) desc.textContent = serviceData[i].d;
      }
    });
    const svcH2 = document.querySelector('#service .section__title');
    if (svcH2) svcH2.innerHTML = '<span class="section__title-en">Service</span> — 提供できること';

    // Process timeline: step titles + desc
    const stepData = [
      { t: 'ヒアリング', d: '課題と目標・要件を丁寧にお伺いし、ゴールを明確化。' },
      { t: 'デザイン提案', d: '情報設計からビジュアルまで、最適なデザインをご提案。' },
      { t: 'コーディング', d: 'パフォーマンスとアクセシビリティに配慮した実装。' },
      { t: '納品・サポート', d: '公開後も更新・改善をサポート。効果検証にも対応。' },
    ];
    document.querySelectorAll('.process-step').forEach((step, i) => {
      const t = step.querySelector('.process-step__title');
      const d = step.querySelector('.process-step__desc');
      if (stepData[i]) {
        if (t) t.textContent = stepData[i].t;
        if (d) d.textContent = stepData[i].d;
      }
    });
    const procH2 = document.querySelector('#process .section__title');
    if (procH2) procH2.innerHTML = '<span class="section__title-en">Process</span> — 制作の流れ';

    // Contact lead + CTA
    const lead = document.querySelector('.contact__lead');
    if (lead) {
      lead.innerHTML = '制作のご相談・お見積りはお気軽にどうぞ。<br>ご要件を確認のうえ、24時間以内にご連絡します。';
    }
    const contactBtn = document.querySelector('.contact .btn.btn--primary.js-open-modal');
    if (contactBtn) contactBtn.textContent = 'お問い合わせフォームを開く';
    const contactH2 = document.querySelector('#contact .section__title');
    if (contactH2) contactH2.innerHTML = '<span class="section__title-en">Contact</span> — お問い合わせ';

    // Skip link (accessibility)
    const skip = document.querySelector('.skip-link');
    if (skip && skip.textContent.trim().length < 2) skip.textContent = 'メインへスキップ';

    // Works: coming soon placeholders
    const workTitles = document.querySelectorAll('.work-card__title');
    const workMetas = document.querySelectorAll('.work-card__meta');
    workTitles.forEach(el => el.textContent = 'Coming Soon');
    workMetas.forEach(el => el.textContent = '制作実績は準備中です');
    const worksHint = document.querySelector('.works__hint');
    if (worksHint) worksHint.textContent = '現在、制作実績は準備中です。個別のサンプルはお問い合わせください。';
    const worksContainer = document.querySelector('#works .container');
    if (worksContainer && !worksContainer.querySelector('.works-cta')){
      const div = document.createElement('div');
      div.className = 'contact__actions works-cta';
      div.style.marginTop = '8px';
      const btn = document.createElement('button');
      btn.className = 'btn btn--primary js-open-modal';
      btn.setAttribute('aria-haspopup','dialog');
      btn.setAttribute('aria-controls','contact-modal');
      btn.textContent = '無料相談へ';
      div.appendChild(btn);
      worksContainer.appendChild(div);
      btn.addEventListener('click', () => document.querySelector('.js-open-modal')?.dispatchEvent(new Event('click')));
    }

    // Modal labels/aria
    const modalTitle = document.getElementById('contact-modal-title');
    if (modalTitle) modalTitle.textContent = 'Contact — お問い合わせ';
    document.querySelectorAll('.modal__close.js-close-modal').forEach(el => el.setAttribute('aria-label','閉じる'));
    const nameLabel = document.querySelector('label[for="name"]');
    if (nameLabel) nameLabel.textContent = 'お名前';
    const nameEl = document.getElementById('name');
    nameEl?.setAttribute('placeholder','山田 太郎');
    nameEl?.setAttribute('autocomplete','name');
    const msgLabel = document.querySelector('label[for="message"]');
    if (msgLabel) msgLabel.textContent = 'メッセージ';
    const msgEl = document.getElementById('message');
    msgEl?.setAttribute('placeholder','ご相談内容やご希望のスケジュールなどをご記入ください');
    const closeBtns = document.querySelectorAll('.js-close-modal.btn--ghost');
    closeBtns.forEach(b => b.textContent = '閉じる');

    // Honeypot
    if (form && !form.querySelector('input[name="_gotcha"]')){
      const hp = document.createElement('input');
      hp.type = 'text'; hp.name = '_gotcha'; hp.tabIndex = -1; hp.autocomplete = 'off';
      hp.setAttribute('aria-hidden','true');
      hp.style.position = 'absolute'; hp.style.left = '-9999px'; hp.style.opacity = '0'; hp.style.height = '0'; hp.style.width = '0';
      form.appendChild(hp);
    }
  };

  applyContentUpgrades();

  // ===== Random starfield (JS-driven, respects reduced motion) =====
  const setupStarfield = () => {
    try{
      if (prefersReduced) return;
      const hero = document.querySelector('.hero');
      if (!hero) return;
      const layer = document.createElement('div');
      layer.className = 'starfield';
      hero.appendChild(layer);

      const isMobile = window.matchMedia?.('(max-width: 768px)')?.matches;
      const COUNT = isMobile ? 70 : 120;

      for (let i = 0; i < COUNT; i++) {
        const s = document.createElement('span');
        s.className = 'star';
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        s.style.top = top + '%';
        s.style.left = left + '%';

        const near = Math.random() < 0.25; // 25%は近景（少し大きく明るい）
        const size = near ? (1.6 + Math.random() * 1.4) : (0.8 + Math.random() * 1.2);
        s.style.setProperty('--size', size + 'px');

        const o1 = (0.42 + Math.random() * 0.45).toFixed(2);
        const o2 = (0.18 + Math.random() * 0.35).toFixed(2);
        s.style.setProperty('--o', o1);
        s.style.setProperty('--o2', o2);

        const tw = Math.round(1800 + Math.random() * 3800);
        const td = Math.round(Math.random() * 3600);
        s.style.setProperty('--tw', tw + 'ms');
        s.style.setProperty('--td', td + 'ms');

        const dx = ((Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 10)).toFixed(1) + 'px';
        const dy = ((Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 14)).toFixed(1) + 'px';
        const dv = Math.round(30000 + Math.random() * 28000); // 30s - 58s
        s.style.setProperty('--dx', dx);
        s.style.setProperty('--dy', dy);
        s.style.setProperty('--dv', dv + 'ms');

        layer.appendChild(s);
      }
    } catch(_){}
  };

  setupStarfield();

  // ===== Shooting stars (night sky) =====
  const setupShootingStars = () => {
    try{
      if (prefersReduced) return; // respect reduced motion
      const hero = document.querySelector('.hero');
      if (!hero) return;

      let active = 0;
      const MAX = 2; // avoid clutter

      const spawn = () => {
        const next = 2200 + Math.random() * 5200; // 2.2s - 7.4s
        setTimeout(() => {
          if (active >= MAX) { spawn(); return; }
          const star = document.createElement('span');
          star.className = 'shooting-star';
          // randomize path
          const top = 10 + Math.random() * 55; // 10% - 65%
          const leftOffset = -12 + Math.random() * 10; // -12% - -2%
          const dx = 520 + Math.random() * 460; // 520px - 980px
          const dy = 120 + Math.random() * 220; // 120px - 340px
          const len = 110 + Math.random() * 80; // 110px - 190px
          const angle = -(12 + Math.random() * 18); // -12deg - -30deg
          const dur = 1100 + Math.random() * 900; // 1.1s - 2s

          star.style.top = top + '%';
          star.style.left = leftOffset + '%';
          star.style.setProperty('--dx', dx + 'px');
          star.style.setProperty('--dy', dy + 'px');
          star.style.setProperty('--angle', angle + 'deg');
          star.style.setProperty('--len', len + 'px');
          star.style.setProperty('--dur', dur + 'ms');

          active++;
          hero.appendChild(star);
          const cleanup = () => { star.remove(); active--; };
          star.addEventListener('animationend', cleanup, { once: true });
          spawn(); // schedule next regardless
        }, next);
      };
      spawn();
    } catch(_){}
  };

  setupShootingStars();

  // ===== Service Detail Modals (cosmic themed, accessible) =====
  const setupServiceModals = () => {
    const cards = document.querySelectorAll('.services .service-card');
    if (!cards.length) return;

    const svcData = [
      {
        key: 'coding',
        title: 'コーディング',
        subtitle: 'デザインとロジックを両立した、再現性の高い実装を。',
        steps: [
          ['要件の確認', 'ページ構成・必要な機能・運用条件を確認し、到達点を共有。'],
          ['実装方針の設計', 'BEM/アクセシビリティ/パフォーマンスの方針を明文化。'],
          ['実装', 'HTML/CSS/JavaScriptで、デザインの再現と保守性を両立。'],
          ['検証', '表示崩れ・キーボード操作・速度(Lighthouse)を確認し調整。'],
          ['納品', 'ソース・ビルド・運用メモをお渡しし、移行を支援。'],
        ],
        deliverables: ['ソースコード一式', 'ビルド成果物', 'パフォーマンスレポート(任意)', '運用メモ/更新手順'],
        duration: '目安: 1〜3週間（規模により変動）',
      },
      {
        key: 'lp',
        title: 'LP制作',
        subtitle: '成果と美しさを両立させる、導線設計とデザイン。',
        steps: [
          ['ヒアリング', '目的・顧客像・訴求軸を整理してKPIを設定。'],
          ['構成・導線設計', '流入〜離脱までのストーリーを設計。ファーストビュー検討。'],
          ['デザイン', 'ワイヤー→ビジュアル制作。夜空の世界観は必要に応じて調整。'],
          ['実装/計測', '軽量・高速を意識して実装。GA4など計測の設定も対応。'],
          ['改善提案', '公開後のABテストや改善仮説をご提案。'],
        ],
        deliverables: ['デザインデータ', '公開ファイル一式', '計測設定(任意)', '改善提案メモ'],
        duration: '目安: 2〜4週間（規模により変動）',
      },
      {
        key: 'wp',
        title: 'WordPress構築',
        subtitle: '運用のしやすさとパフォーマンスを考慮したCMS設計。',
        steps: [
          ['情報設計', '投稿タイプ・フィールド・権限を整理。UI/運用の楽さを設計。'],
          ['テーマ/ブロック', '必要十分な機能に絞り、軽量なテーマ/ブロックを実装。'],
          ['パフォーマンス/セキュリティ', 'キャッシュ・画像最適化・不要プラグイン排除。'],
          ['移行/トレーニング', '本番移行と運用ガイド共有。簡単な操作説明を実施。'],
          ['保守(任意)', '更新/バックアップ/小改善を継続支援。'],
        ],
        deliverables: ['テーマ/プラグイン一式', '編集ガイド', 'バックアップ/運用設定'],
        duration: '目安: 3〜6週間（規模により変動）',
      }
    ];

    // Create modal container once
    let svcModal = document.getElementById('service-modal');
    if (!svcModal) {
      svcModal = document.createElement('div');
      svcModal.className = 'modal svc-modal';
      svcModal.id = 'service-modal';
      svcModal.setAttribute('role', 'dialog');
      svcModal.setAttribute('aria-modal', 'true');
      svcModal.setAttribute('aria-hidden', 'true');
      svcModal.innerHTML = `
        <div class="modal__overlay js-svc-close" data-close="overlay"></div>
        <div class="modal__content modal--wide" role="document">
          <button class="modal__close js-svc-close" aria-label="閉じる">×</button>
          <div class="svc-wrap" tabindex="-1"></div>
        </div>`;
      document.body.appendChild(svcModal);
    }

    const svcWrap = svcModal.querySelector('.svc-wrap');
    const getFocusable = (root) => root?.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ) || [];
    const trapSvcKey = (e) => {
      if (e.key !== 'Tab' || svcModal?.getAttribute('aria-hidden') !== 'false') return;
      const focusables = [...getFocusable(svcModal)].filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const openSvc = () => {
      svcModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const first = getFocusable(svcModal)[0];
      setTimeout(() => first?.focus(), 30);
      document.addEventListener('keydown', trapSvcKey);
    };
    const closeSvc = () => {
      svcModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', trapSvcKey);
    };
    svcModal.querySelectorAll('.js-svc-close').forEach(btn => btn.addEventListener('click', () => closeSvc()));
    svcModal.addEventListener('click', (e) => {
      if ((e.target instanceof HTMLElement) && e.target.dataset.close === 'overlay') closeSvc();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && svcModal.getAttribute('aria-hidden') === 'false') closeSvc();
    });

    const htmlFor = (d) => {
      const steps = d.steps.map((s, i) => `
        <li class="svc-step">
          <div class="svc-step__num">${i + 1}</div>
          <div class="svc-step__body">
            <h4 class="svc-step__title">${s[0]}</h4>
            <p class="svc-step__desc">${s[1]}</p>
          </div>
        </li>
      `).join('');
      const dels = d.deliverables.map(item => `<li class="svc-li">${item}</li>`).join('');
      return `
        <header class="svc-head">
          <h3 class="svc-title">${d.title}</h3>
          <p class="svc-sub">${d.subtitle}</p>
        </header>
        <section class="svc-sec">
          <h4 class="svc-sec__title">進め方</h4>
          <ol class="svc-steps">${steps}</ol>
        </section>
        <section class="svc-sec">
          <h4 class="svc-sec__title">成果物</h4>
          <ul class="svc-list">${dels}</ul>
          <p class="svc-note">${d.duration}</p>
        </section>
        <div class="form-actions svc-actions">
          <button class="btn btn--primary js-svc-contact">無料相談へ</button>
          <button class="btn btn--ghost js-svc-close">閉じる</button>
        </div>
      `;
    };

    const openForKey = (key) => {
      const d = svcData.find(s => s.key === key);
      if (!d || !svcWrap) return;
      svcWrap.innerHTML = htmlFor(d);
      // bind CTA → existing contact modal
      svcWrap.querySelector('.js-svc-contact')?.addEventListener('click', () => {
        closeSvc();
        // open contact modal using existing handler
        const btn = document.querySelector('.js-open-modal');
        if (btn instanceof HTMLElement) setTimeout(() => btn.click(), 80);
      });
      // close buttons
      svcWrap.querySelectorAll('.js-svc-close').forEach(b => b.addEventListener('click', () => closeSvc()));
      openSvc();
    };

    // Attach to cards (role/button + keyboard)
    cards.forEach((card, i) => {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      const map = ['coding','lp','wp'];
      const key = map[i] || map[0];
      card.addEventListener('click', () => openForKey(key));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openForKey(key); }
      });
    });
  };

  setupServiceModals();

})();

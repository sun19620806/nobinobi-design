/* のびのび訪問施術院 — shared interactions */
(function () {
  // ---- お問い合わせ送信（基幹システム web-inquiry-intake へ） ----
  // 公開の匿名 intake エンドポイント。CORS・レート制限・ハニーポットで保護。
  var INQUIRY_ENDPOINT = 'https://nzoklmgjsdffilydwqur.supabase.co/functions/v1/web-inquiry-intake';

  // payload を基幹へ POST。成功で {ok:true,id} を返す。失敗時は例外を投げる。
  function submitInquiry(payload) {
    return fetch(INQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || !data || data.ok !== true) {
          var err = new Error((data && data.error) || ('http_' + res.status));
          err.code = (data && data.error) || ('http_' + res.status);
          throw err;
        }
        return data;
      });
    });
  }

  // ---- Mobile drawer ----
  function initDrawer() {
    var burger = document.querySelector('.hamburger');
    var drawer = document.querySelector('.drawer');
    if (!burger || !drawer) return;
    var close = drawer.querySelector('.close');
    function open() { drawer.classList.add('open'); document.body.classList.add('drawer-open'); document.body.style.overflow = 'hidden'; }
    function shut() { drawer.classList.remove('open'); document.body.classList.remove('drawer-open'); document.body.style.overflow = ''; }
    burger.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    drawer.addEventListener('click', function (e) { if (e.target === drawer) shut(); });
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', shut); });
    // 旧・下部固定バー（メニュー＋お問い合わせ）は廃止。
    // メニューはヘッダーのハンバーガー、問い合わせはチャットFABに一本化。
  }

  // ---- FAQ accordion ----
  function initFaq() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var q = item.querySelector('.faq-q');
      if (!q) return;
      q.addEventListener('click', function () {
        var open = item.classList.contains('open');
        // optional: close siblings within same group
        item.classList.toggle('open', !open);
      });
    });
  }

  // ---- Scroll reveal (with grid stagger) ----
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    // stagger siblings that share a parent so grids cascade in
    els.forEach(function (e) {
      var parent = e.parentNode;
      var sibs = [].slice.call(parent.children).filter(function (c) { return c.classList && c.classList.contains('reveal'); });
      var idx = sibs.indexOf(e);
      e.style.transitionDelay = (Math.min(idx, 6) * 90) + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // ---- Scroll progress bar ----
  function initProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || window.pageYOffset) / max : 0;
      bar.style.width = (p * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---- Header condense on scroll ----
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      header.classList.toggle('scrolled', y > 30);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---- Back to top (desktop) ----
  function initBackTop() {
    var btn = document.createElement('button');
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'ページ上部へ戻る');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 19V6M6 12l6-6 6 6"/></svg>';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      btn.classList.toggle('show', y > 600);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---- Contact form ----
  function initForm() {
    var form = document.querySelector('#contact-form');
    if (!form) return;

    var typeRadios = form.querySelectorAll('input[name="type"]');
    var submitBtn = form.querySelector('#submit-btn');
    var trialNote = form.querySelector('#trial-note');
    var msgLabel = form.querySelector('#message-label');
    var msgField = form.querySelector('#message-field');

    function syncTrial() {
      var sel = form.querySelector('input[name="type"]:checked');
      var val = sel ? sel.value : '';
      var isTrial = val === '無料体験のお申し込み';
      var isRecruit = val === '採用について';
      if (submitBtn) {
        submitBtn.firstChild.nodeValue = isTrial ? '無料体験を申し込む ' : (isRecruit ? '求人に応募する ' : 'この内容で送信する ');
      }
      if (trialNote) { trialNote.style.display = isTrial ? 'flex' : 'none'; }
      if (msgLabel && msgField) {
        if (isRecruit) {
          msgLabel.innerHTML = '応募の動機・ご質問など <span class="opt">任意</span>';
          msgField.placeholder = '保有資格、これまでのご経験、ご希望の働き方（常勤／非常勤）、面接のご希望などがあればご記入ください。';
        } else {
          msgLabel.innerHTML = 'ご相談内容 <span class="opt">任意</span>';
          msgField.placeholder = 'お身体のお悩みや、ご希望の曜日・時間帯などがあればご記入ください。';
        }
      }
    }

    // pre-select 種類 when arriving via ?type=xxx
    var typeMap = {
      trial: '無料体験のお申し込み',
      service: 'サービス・施術について',
      price: '料金・保険について',
      recruit: '採用について',
      other: 'その他'
    };
    var params = new URLSearchParams(window.location.search);
    var pType = params.get('type');
    if (pType && typeMap[pType]) {
      var target = form.querySelector('input[name="type"][value="' + typeMap[pType] + '"]');
      if (target) { target.checked = true; }
    }
    typeRadios.forEach(function (r) { r.addEventListener('change', syncTrial); });
    syncTrial();

    // ハニーポット（ボット除け・画面外の隠しフィールド）を動的に追加
    var honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'hp';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.appendChild(honeypot);

    // 種類 → 基幹の category マッピング
    var categoryMap = {
      '無料体験のお申し込み': 'trial',
      'サービス・施術について': 'general',
      '料金・保険について': 'general',
      '採用について': 'recruit',
      'その他': 'general'
    };

    // 送信エラー表示要素
    var errBox = document.createElement('p');
    errBox.className = 'form-error';
    errBox.style.display = 'none';
    if (submitBtn && submitBtn.parentNode) { submitBtn.parentNode.insertBefore(errBox, submitBtn); }

    function val(sel) { var el = form.querySelector(sel); return el ? el.value.trim() : ''; }
    function radio(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitBtn && submitBtn.disabled) return;

      var typeVal = radio('type');
      var payload = {
        category: categoryMap[typeVal] || 'general',
        name: val('input[name="name"]'),
        kana: val('input[name="kana"]'),
        phone: val('input[name="tel"]'),
        email: val('input[name="email"]'),
        clinic: radio('clinic'),
        message: val('#message-field'),
        source: 'website',
        hp: honeypot.value
      };
      // 連絡方法の希望はメッセージ末尾に付記
      var reply = radio('reply');
      if (reply && reply !== 'どちらでも') {
        payload.message = (payload.message ? payload.message + '\n' : '') + '【ご希望の連絡方法】' + reply;
      }

      errBox.style.display = 'none';
      var origLabel = submitBtn ? submitBtn.firstChild.nodeValue : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.firstChild.nodeValue = '送信中… '; }

      submitInquiry(payload).then(function () {
        var done = document.querySelector('#form-done');
        form.style.display = 'none';
        if (done) { done.style.display = 'block'; }
        var anchor = document.querySelector('#contact-form-top') || done;
        var top = (anchor && anchor.getBoundingClientRect().top + window.pageYOffset - 120) || 0;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }).catch(function (err) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.firstChild.nodeValue = origLabel; }
        var msg = '送信に失敗しました。お手数ですが、時間をおいて再度お試しいただくか、お電話（06-7777-7849）でご連絡ください。';
        if (err && err.code === 'rate_limited') {
          msg = '送信が混み合っています。1分ほどおいてから、もう一度お試しください。';
        } else if (err && err.code === 'contact_required') {
          msg = '電話番号またはメールアドレスのいずれかをご入力ください。';
        } else if (err && err.code === 'email_invalid') {
          msg = 'メールアドレスの形式をご確認ください。';
        }
        errBox.textContent = msg;
        errBox.style.display = 'block';
      });
    });
  }

  // ---- Ken Burns on standalone photos ----
  function initKenBurns() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sels = ['.feature .media', '.work-img', '.media--wide', '.cb-photo'];
    document.querySelectorAll(sels.join(',')).forEach(function (wrap) {
      wrap.classList.add('kb');
    });
  }

  // ---- Column category filter ----
  function initColumnFilter() {
    var tabs = document.querySelectorAll('.col-tab');
    var cards = document.querySelectorAll('.col-grid .col-card');
    if (!tabs.length || !cards.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var f = tab.getAttribute('data-filter');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        cards.forEach(function (c) {
          var show = (f === 'all' || c.getAttribute('data-cat') === f);
          c.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  // ---- Article table of contents (auto) ----
  function initToc() {
    var body = document.querySelector('.article-body');
    var mount = document.querySelector('#article-toc');
    if (!body || !mount) return;
    var heads = body.querySelectorAll('h2');
    if (heads.length < 3) { mount.remove(); return; }
    var html = '<div class="toc-head"><span class="toc-ic"><svg viewBox="0 0 24 24" fill="none"><path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>目次</div><ol class="toc-list">';
    heads.forEach(function (h, i) {
      var id = 'sec-' + (i + 1);
      h.id = id;
      html += '<li><a href="#' + id + '">' + h.textContent + '</a></li>';
    });
    html += '</ol>';
    mount.innerHTML = html;

    // 項目が多いときは折りたたむ（スマホで本文までのスクロールを短く）
    var LIMIT = 6;
    if (heads.length > LIMIT) {
      mount.classList.add('is-clamped');
      mount.style.setProperty('--toc-shown', LIMIT);
      var tog = document.createElement('button');
      tog.type = 'button';
      tog.className = 'toc-toggle';
      var rest = heads.length - LIMIT;
      tog.innerHTML = '<span>ほか' + rest + '項目を表示</span><svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      tog.addEventListener('click', function () {
        var open = mount.classList.toggle('is-open');
        mount.classList.toggle('is-clamped', !open);
        tog.querySelector('span').textContent = open ? '目次を閉じる' : 'ほか' + rest + '項目を表示';
        tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      tog.setAttribute('aria-expanded', 'false');
      mount.appendChild(tog);
    }

    mount.querySelectorAll('.toc-list a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
      });
    });

    // 現在読んでいる章を目次でハイライト
    if ('IntersectionObserver' in window) {
      var links = {};
      mount.querySelectorAll('.toc-list a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          Object.keys(links).forEach(function (k) { links[k].classList.toggle('is-current', k === en.target.id); });
        });
      }, { rootMargin: '-90px 0px -70% 0px' });
      heads.forEach(function (h) { io.observe(h); });
    }
  }



  // ---- コラム一覧のキーワード検索 ----
  function initColumnSearch() {
    var input = document.getElementById('col-q');
    var list = document.querySelector('.col-list');
    if (!input || !list) return;
    var wrap = document.getElementById('col-search');
    var count = document.getElementById('col-count');
    var clear = wrap.querySelector('.cs-clear');
    var rows = [].slice.call(list.querySelectorAll('.col-row'));
    var secs = [].slice.call(list.querySelectorAll('.col-sec'));
    var jump = document.querySelector('.col-jump');

    rows.forEach(function (r) {
      var t = r.querySelector('.col-row-t');
      r._t = t;
      r._raw = t.textContent;
      r._key = (r._raw + ' ' + (r.closest('.col-sec') ? r.closest('.col-sec').querySelector('.col-sec-txt b').textContent : '')).toLowerCase();
    });

    function apply() {
      var q = input.value.trim().toLowerCase();
      wrap.classList.toggle('has-q', q.length > 0);
      var hit = 0;
      rows.forEach(function (r) {
        var on = !q || r._key.indexOf(q) > -1;
        r.classList.toggle('is-off', !on);
        if (on) hit++;
        if (q && on) {
          var idx = r._raw.toLowerCase().indexOf(q);
          if (idx > -1) {
            r._t.innerHTML = escapeHtml(r._raw.slice(0, idx)) + '<mark>' + escapeHtml(r._raw.slice(idx, idx + q.length)) + '</mark>' + escapeHtml(r._raw.slice(idx + q.length));
          } else { r._t.textContent = r._raw; }
        } else { r._t.textContent = r._raw; }
      });
      secs.forEach(function (s) {
        var any = s.querySelectorAll('.col-row:not(.is-off)').length;
        s.classList.toggle('is-empty', any === 0);
        var n = s.querySelector('.col-sec-n');
        if (n) { n.firstChild.nodeValue = q ? String(any) : n.getAttribute('data-all') || n.firstChild.nodeValue; }
      });
      list.classList.toggle('is-empty', hit === 0);
      if (jump) jump.style.display = q ? 'none' : '';
      if (count) {
        count.hidden = !q;
        count.innerHTML = '「' + escapeHtml(input.value.trim()) + '」に一致する記事 <b>' + hit + '</b> 件';
      }
    }
    function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    list.querySelectorAll('.col-sec-n').forEach(function (n) { n.setAttribute('data-all', n.firstChild.nodeValue); });
    input.addEventListener('input', apply);
    clear.addEventListener('click', function () { input.value = ''; apply(); input.focus(); });
  }

  // ---- 料金シミュレーター ----
  function initPriceSim() {
    var root = document.getElementById('psim');
    if (!root) return;
    var range = document.getElementById('psim-range');
    var state = { rate: 0.1, place: [3950, 4120, 2000, 2320], tech: 0, freq: 3 };
    var yen = function (n) { return n.toLocaleString('ja-JP') + '円'; };

    function render() {
      var full = state.place[state.tech];
      var firstFull = state.place[2 + state.tech];
      var one = Math.round(full * state.rate);
      var first = Math.round(firstFull * state.rate);
      document.getElementById('psim-one').textContent = yen(one);
      document.getElementById('psim-week').textContent = yen(one * state.freq);
      document.getElementById('psim-month').textContent = (one * state.freq * 4).toLocaleString('ja-JP');
      document.getElementById('psim-first').textContent = '＋' + yen(first);
      document.getElementById('psim-freq').textContent = state.freq + '回';
      range.style.setProperty('--fill', ((state.freq - 1) / 4 * 100) + '%');
    }

    root.querySelectorAll('.psim-seg').forEach(function (seg) {
      var key = seg.getAttribute('data-sim');
      seg.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          var v = b.getAttribute('data-v');
          state[key] = v.indexOf(',') > -1 ? v.split(',').map(Number) : Number(v);
          render();
        });
      });
    });
    range.addEventListener('input', function () { state.freq = Number(range.value); render(); });
    render();
  }

  // ---- お問い合わせチャット（フォーム型・全ページ右下に表示） ----
  function initChat() {
    if (document.querySelector('.nchat')) return;

    // 立場の選択肢（type にマップ）
    var STANCE = [
      { label: 'ご本人・ご家族', type: 'family' },
      { label: 'ケアマネジャー', type: 'care' },
      { label: '施設スタッフ', type: 'facility' },
      { label: 'その他', type: 'other' }
    ];
    // カテゴリ別ステップ定義
    // kind: 'choice'(単一ボタン) | 'chips'(タップ選択+自由入力) | 'text' | 'tel' | 'email' | 'textarea'
    // field: payload へ直接マップするキー / msgLabel: 問い合わせ本文に「【label】値」で追記
    var FLOWS = {
      trial: {
        label: '無料体験のお申し込み',
        steps: [
          { key: 'stance', kind: 'choice', options: STANCE.map(function (s) { return s.label; }), prompt: 'ありがとうございます。まず、お差し支えなければあなたのお立場を教えてください。' },
          { key: 'area', kind: 'text', required: true, msgLabel: 'お住まいの地域',
            prompt: '対象となる方のお住まいの地域を教えてください（都道府県・市区町村まで。詳しくご記入いただいてもOKです）。', ph: '例）大阪府大阪市北区' },
          { key: 'symptom', kind: 'chips', multi: true, skippable: true, msgLabel: 'お悩み・症状',
            options: ['膝の痛み', '腰・背中の痛み', '肩こり・首の痛み', '歩行がしづらい', '麻痺・しびれ', 'むくみ', '関節が動かしにくい', 'リハビリをしたい'],
            prompt: '気になる症状・お悩みをタップで選んでください（複数可・自由入力も可／任意）。' },
          { key: 'preftime', kind: 'chips', multi: true, skippable: true, msgLabel: 'ご希望の曜日・時間帯',
            options: ['平日 午前', '平日 午後', 'いつでも可'],
            prompt: 'ご希望の曜日・時間帯があれば選んでください（土日祝を除く平日で承ります／複数可・任意）。自由入力もできます。' },
          { key: 'name', kind: 'text', required: true, field: 'name', prompt: 'お申し込みされる方のお名前を教えてください。', ph: '例）山田 太郎' },
          { key: 'phone', kind: 'tel', required: true, field: 'phone', prompt: '日中つながりやすいお電話番号をお願いします。', ph: '例）09012345678' },
          { key: 'email', kind: 'email', skippable: true, field: 'email', prompt: 'メールアドレスがあれば入力してください（任意・下の候補で入力を短縮できます）。', ph: '例）sample@example.com' }
        ]
      },
      intro: {
        label: 'ケアマネ・施設からのご紹介／ご相談',
        steps: [
          { key: 'stance', kind: 'choice', options: ['ケアマネジャー', '施設スタッフ', 'その他'], prompt: 'ありがとうございます。あなたのお立場を教えてください。' },
          { key: 'introtopic', kind: 'chips', multi: true, required: true, msgLabel: 'ご相談内容',
            options: ['利用者様のご紹介', 'サービス内容の確認', '訪問エリアの確認', '料金・保険について', '書類・連携について'],
            prompt: 'ご相談内容をタップで選んでください（複数可・自由入力も可）。' },
          { key: 'org', kind: 'text', skippable: true, msgLabel: '事業所・施設', prompt: '事業所・施設名を教えてください（任意）。', ph: '例）〇〇居宅介護支援事業所' },
          { key: 'area', kind: 'text', required: true, msgLabel: 'お住まいの地域',
            prompt: '対象となる方のお住まいの地域を教えてください（都道府県・市区町村まで。詳しくご記入いただいてもOKです）。', ph: '例）大阪府大阪市北区' },
          { key: 'name', kind: 'text', required: true, field: 'name', prompt: 'ご担当者様のお名前を教えてください。', ph: '例）山田 太郎' },
          { key: 'phone', kind: 'tel', required: true, field: 'phone', prompt: 'ご連絡先のお電話番号をお願いします。', ph: '例）0677777849' },
          { key: 'email', kind: 'email', skippable: true, field: 'email', prompt: 'メールアドレスがあれば入力してください（任意）。', ph: '例）sample@example.com' }
        ]
      },
      general: {
        label: 'サービス・料金の一般のお問い合わせ',
        steps: [
          { key: 'stance', kind: 'choice', options: STANCE.map(function (s) { return s.label; }), prompt: 'ありがとうございます。あなたのお立場を教えてください。' },
          { key: 'topic', kind: 'chips', multi: true, required: true, msgLabel: 'ご相談内容',
            options: ['料金・費用について', '医療保険の適用', '対応エリア', '施術の内容', '訪問の頻度', 'キャンセルについて'],
            prompt: 'お聞きになりたい内容をタップで選んでください（複数可・自由入力も可）。' },
          { key: 'name', kind: 'text', required: true, field: 'name', prompt: 'お名前を教えてください。', ph: '例）山田 太郎' },
          { key: 'phone', kind: 'tel', required: true, field: 'phone', prompt: 'ご連絡先のお電話番号をお願いします。', ph: '例）09012345678' },
          { key: 'email', kind: 'email', skippable: true, field: 'email', prompt: 'メールアドレスがあれば入力してください（任意）。', ph: '例）sample@example.com' }
        ]
      },
      recruit: {
        label: '求人・採用のご応募',
        steps: [
          { key: 'role', kind: 'chips', multi: false, required: true, field: 'role',
            options: ['鍼灸師', 'あん摩マッサージ指圧師', '資格取得予定', '事務・その他'],
            prompt: 'ご応募ありがとうございます。ご希望の職種をタップで選んでください（自由入力も可）。' },
          { key: 'worktype', kind: 'chips', multi: false, skippable: true, msgLabel: 'ご希望の働き方',
            options: ['常勤', '非常勤・パート', '業務委託', '未定'],
            prompt: 'ご希望の働き方があれば選んでください（任意）。' },
          { key: 'name', kind: 'text', required: true, field: 'name', prompt: 'お名前を教えてください。', ph: '例）山田 太郎' },
          { key: 'phone', kind: 'tel', required: true, field: 'phone', prompt: 'ご連絡先のお電話番号をお願いします。', ph: '例）09000000000' },
          { key: 'email', kind: 'email', skippable: true, field: 'email', prompt: 'メールアドレスがあれば入力してください（任意）。', ph: '例）sample@example.com' },
          { key: 'body', kind: 'textarea', skippable: true, msgLabel: '志望動機・ご質問', prompt: '志望動機・ご質問などがあればご記入ください（任意）。', ph: '' }
        ]
      }
    };

    // ---- 営業時間の判定（JST：平日9:00〜18:00、土日祝休み） ----
    // 毎年固定の祝日（MM-DD）。振替休日は簡易のため未考慮。
    var FIXED_HOLIDAYS = ['01-01', '02-11', '02-23', '04-29', '05-03', '05-04', '05-05', '08-11', '11-03', '11-23'];
    // 変動祝日・振替（YYYY-MM-DD）※年1回見直し
    var VAR_HOLIDAYS = [
      '2026-01-12', '2026-03-20', '2026-05-06', '2026-07-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12',
      '2027-01-11', '2027-03-21', '2027-07-19', '2027-09-20', '2027-09-23', '2027-10-11'
    ];
    function businessStatus() {
      try {
        var parts = {};
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Tokyo', weekday: 'short',
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
        }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
        var wd = parts.weekday, hour = parseInt(parts.hour, 10);
        var ymd = parts.year + '-' + parts.month + '-' + parts.day, md = parts.month + '-' + parts.day;
        var closed = (wd === 'Sat' || wd === 'Sun') || FIXED_HOLIDAYS.indexOf(md) >= 0 || VAR_HOLIDAYS.indexOf(ymd) >= 0;
        var open = !closed && hour >= 9 && hour < 18;
        return { open: open, label: open ? '営業中' : '営業時間外' };
      } catch (e) { return { open: false, label: '営業時間' }; }
    }

    // ---- DOM 構築 ----
    var root = document.createElement('div');
    root.className = 'nchat';
    root.innerHTML =
      '<button class="nchat-fab" aria-label="チャットで相談する">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3v-3H6a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' +
        '<span>相談する</span>' +
      '</button>' +
      '<div class="nchat-panel" role="dialog" aria-label="お問い合わせチャット">' +
        '<div class="nchat-head">' +
          '<div class="nchat-htxt">' +
            '<span class="nchat-title">のびのび お問い合わせ</span>' +
            '<span class="nchat-status"><i class="nchat-dot"></i><span class="nchat-stxt"></span></span>' +
          '</div>' +
          '<button class="nchat-close" aria-label="閉じる">×</button>' +
        '</div>' +
        '<div class="nchat-log" id="nchat-log"></div>' +
        '<div class="nchat-dock" id="nchat-dock"></div>' +
        '<input type="text" name="nc_extra_note" tabindex="-1" autocomplete="off" autocorrect="off" aria-hidden="true" class="nchat-hp">' +
      '</div>';
    document.body.appendChild(root);

    var fab = root.querySelector('.nchat-fab');
    var panel = root.querySelector('.nchat-panel');
    var closeBtn = root.querySelector('.nchat-close');
    var log = root.querySelector('#nchat-log');
    var dock = root.querySelector('#nchat-dock');
    var hp = root.querySelector('.nchat-hp');
    var statusWrap = root.querySelector('.nchat-status');
    var statusTxt = root.querySelector('.nchat-stxt');

    function updateStatus() {
      var s = businessStatus();
      statusTxt.textContent = s.label + '・平日9:00〜18:00';
      statusWrap.classList.toggle('is-open', s.open);
      statusWrap.classList.toggle('is-closed', !s.open);
    }
    updateStatus();

    var st = { category: null, stepIdx: 0, data: {}, type: null, sending: false, done: false };

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function scrollLog() { log.scrollTop = log.scrollHeight; }
    function bot(text) {
      var b = document.createElement('div');
      b.className = 'nc-msg nc-bot';
      b.textContent = text;
      log.appendChild(b); scrollLog();
      return b;
    }
    function user(text) {
      var b = document.createElement('div');
      b.className = 'nc-msg nc-user';
      b.textContent = text;
      log.appendChild(b); scrollLog();
    }
    function clearDock() { dock.innerHTML = ''; }

    // タイピングインジケータ（…）を見せてから cb を実行＝“会話してる感”
    function typing(cb) {
      clearDock();
      var t = document.createElement('div');
      t.className = 'nc-msg nc-bot nc-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      log.appendChild(t); scrollLog();
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); cb(); }, 460);
    }

    // 意図しない自動入力・iOS自動ズームの抑止をまとめて付与
    function setNoAutofill(field) {
      field.setAttribute('autocomplete', 'off');
      field.setAttribute('autocorrect', 'off');
      field.setAttribute('autocapitalize', 'off');
      field.setAttribute('spellcheck', 'false');
    }

    // 電話番号のライブ整形（携帯11桁=3-4-4 / 03・06の10桁=2-4-4 / 0120=4-3-3）。
    // それ以外は数字のまま（誤整形を避ける）。
    function fmtTel(raw) {
      var d = (raw || '').replace(/[^0-9]/g, '').slice(0, 11);
      if (/^0[789]0\d/.test(d) && d.length > 6) return d.replace(/^(\d{3})(\d{4})(\d{0,4}).*/, function (_, a, b, c) { return c ? a + '-' + b + '-' + c : a + '-' + b; });
      if (/^0(3|6)\d/.test(d) && d.length > 6) return d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, function (_, a, b, c) { return c ? a + '-' + b + '-' + c : a + '-' + b; });
      if (/^0120\d/.test(d) && d.length > 4) return d.replace(/^(\d{4})(\d{0,3})(\d{0,3}).*/, function (_, a, b, c) { return c ? a + '-' + b + '-' + c : (b ? a + '-' + b : a); });
      return d;
    }
    function telDigits(v) { return (v || '').replace(/[^0-9]/g, ''); }

    function choiceButtons(options, onPick) {
      clearDock();
      options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nc-choice';
        btn.textContent = opt;
        btn.addEventListener('click', function () { onPick(opt); });
        dock.appendChild(btn);
      });
    }

    function hintEl(form, text) {
      var h = form.querySelector('.nc-hint');
      if (!h) { h = document.createElement('div'); h.className = 'nc-hint'; form.appendChild(h); }
      h.textContent = text;
    }

    // タップ選択チップ（単一/複数）＋自由入力を1画面で。回答は「A・B・自由文」の文字列。
    function chipsInput(step, onSubmit) {
      clearDock();
      var selected = [];
      var chipsWrap = document.createElement('div');
      chipsWrap.className = 'nc-chips';
      step.options.forEach(function (opt) {
        var c = document.createElement('button');
        c.type = 'button'; c.className = 'nc-chip'; c.textContent = opt;
        c.addEventListener('click', function () {
          if (!step.multi) {
            selected = [];
            chipsWrap.querySelectorAll('.nc-chip').forEach(function (x) { x.classList.remove('on'); });
          }
          var i = selected.indexOf(opt);
          if (i >= 0) { selected.splice(i, 1); c.classList.remove('on'); }
          else { selected.push(opt); c.classList.add('on'); }
        });
        chipsWrap.appendChild(c);
      });
      dock.appendChild(chipsWrap);

      var form = document.createElement('form');
      form.className = 'nc-inputrow';
      var field = document.createElement('input');
      field.type = 'text'; field.className = 'nc-field';
      field.placeholder = step.freePh || 'その他・補足（自由入力・任意）';
      setNoAutofill(field);
      form.appendChild(field);
      var send = document.createElement('button');
      send.type = 'submit'; send.className = 'nc-send'; send.textContent = '送信';
      form.appendChild(send);
      if (step.skippable) {
        var skip = document.createElement('button');
        skip.type = 'button'; skip.className = 'nc-skip'; skip.textContent = 'スキップ';
        skip.addEventListener('click', function () { onSubmit(''); });
        form.appendChild(skip);
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var free = field.value.trim();
        var parts = selected.slice();
        if (free) parts.push(free);
        var val = parts.join('・');
        if (step.required && !val) { hintEl(form, '1つ以上お選びいただくか、自由入力してください。'); return; }
        onSubmit(val);
      });
      dock.appendChild(form);
    }

    function textInput(step, onSubmit) {
      clearDock();

      // メール: よく使うドメイン候補チップ（タップで補完）
      if (step.kind === 'email') {
        var dom = document.createElement('div');
        dom.className = 'nc-chips nc-domains';
        ['@gmail.com', '@icloud.com', '@yahoo.co.jp', '@docomo.ne.jp'].forEach(function (d) {
          var c = document.createElement('button');
          c.type = 'button'; c.className = 'nc-chip nc-chip-sm'; c.textContent = d;
          c.addEventListener('click', function () {
            var v = field.value.trim();
            var local = v.split('@')[0] || '';
            field.value = local + d;
            field.focus();
          });
          dom.appendChild(c);
        });
        dock.appendChild(dom);
      }

      var wrap = document.createElement('form');
      wrap.className = 'nc-inputrow';
      var field = step.kind === 'textarea'
        ? document.createElement('textarea')
        : document.createElement('input');
      if (step.kind === 'tel') { field.type = 'tel'; field.setAttribute('inputmode', 'tel'); }
      else if (step.kind === 'email') { field.type = 'email'; field.setAttribute('inputmode', 'email'); }
      else if (step.kind !== 'textarea') field.type = 'text';
      field.className = 'nc-field';
      field.placeholder = step.ph || '';
      setNoAutofill(field);
      // 電話番号はライブ整形（数字入力→自動ハイフン）
      if (step.kind === 'tel') {
        field.addEventListener('input', function () { field.value = fmtTel(field.value); });
      }
      wrap.appendChild(field);
      var send = document.createElement('button');
      send.type = 'submit';
      send.className = 'nc-send';
      send.textContent = '送信';
      wrap.appendChild(send);
      if (step.skippable) {
        var skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'nc-skip';
        skip.textContent = 'スキップ';
        skip.addEventListener('click', function () { onSubmit(''); });
        wrap.appendChild(skip);
      }
      wrap.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = field.value.trim();
        if (step.required && !v) { field.focus(); field.classList.add('nc-err'); return; }
        if (step.kind === 'email' && v && !EMAIL_RE.test(v)) { field.classList.add('nc-err'); hintEl(wrap, 'メールアドレスの形式をご確認ください。'); return; }
        if (step.kind === 'tel' && v) {
          var n = telDigits(v);
          if (n.length < 10 || n.length > 11) { field.classList.add('nc-err'); hintEl(wrap, '電話番号は10〜11桁でご入力ください。'); return; }
        }
        onSubmit(v);
      });
      dock.appendChild(wrap);
      field.focus();
    }

    function start() {
      log.innerHTML = ''; st = { category: null, stepIdx: 0, data: {}, type: null, sending: false, done: false };
      bot('こんにちは。のびのび訪問施術院です。どのようなご用件でしょうか？下のボタンからお選びください。');
      // 営業時間・返信目安・フォーム導線をまとめた案内
      var s = businessStatus();
      var note = document.createElement('div');
      note.className = 'nc-msg nc-bot nc-note';
      note.innerHTML =
        '<b>営業時間：平日 9:00〜18:00</b>（土日祝休み）／お問い合わせには<b>原則24時間以内</b>（土日祝を除く）にご返信します。' +
        (s.open ? '' : '<br>ただいま営業時間外のため、ご返信は翌営業日以降になります。') +
        '<br>じっくり入力されたい方は<a href="contact.html">お問い合わせフォーム</a>もご利用いただけます。';
      log.appendChild(note); scrollLog();
      choiceButtons(
        ['無料体験を申し込みたい', 'ケアマネ・施設からの紹介／相談', 'サービス・料金を知りたい', '求人・採用に応募したい'],
        function (label) {
          var map = { '無料体験を申し込みたい': 'trial', 'ケアマネ・施設からの紹介／相談': 'intro', 'サービス・料金を知りたい': 'general', '求人・採用に応募したい': 'recruit' };
          st.category = map[label];
          user(label);
          runStep();
        }
      );
    }

    function advance(step, v) {
      st.data[step.key] = v;
      if (step.key === 'stance') {
        var found = STANCE.filter(function (s) { return s.label === v; })[0];
        st.type = found ? found.type : 'other';
      }
      user(v ? v : '（スキップ）');
      st.stepIdx++; runStep();
    }
    function runStep() {
      var flow = FLOWS[st.category];
      if (st.stepIdx >= flow.steps.length) { confirmStep(); return; }
      var step = flow.steps[st.stepIdx];
      typing(function () {
        bot(step.prompt);
        if (step.kind === 'choice') {
          choiceButtons(step.options, function (opt) { advance(step, opt); });
        } else if (step.kind === 'chips') {
          chipsInput(step, function (v) { advance(step, v); });
        } else {
          textInput(step, function (v) { advance(step, v); });
        }
        setTimeout(scrollLog, 40); // 入力欄が伸びた後に最新の質問まで追従
      });
    }

    function buildPayload() {
      var d = st.data;
      var flow = FLOWS[st.category];
      var payload = { category: st.category, type: st.type || undefined, name: '', phone: '', email: '', clinic: '', message: '', source: 'chat', hp: hp.value };
      var msgParts = [];
      flow.steps.forEach(function (step) {
        var v = d[step.key];
        if (!v) return;
        if (step.field === 'clinic') payload.clinic = (v !== 'まだ決めていない') ? v : '';
        else if (step.field === 'name') payload.name = v;
        else if (step.field === 'phone') payload.phone = v;
        else if (step.field === 'email') payload.email = v;
        else if (step.field === 'role') payload.recruitRole = v;
        else if (step.field === 'license') payload.recruitLicense = v;
        else if (step.msgLabel) msgParts.push('【' + step.msgLabel + '】' + v);
        else if (step.key === 'body') msgParts.push(v);
      });
      payload.message = msgParts.join('\n');
      return payload;
    }

    function confirmStep() {
      var p = buildPayload();
      var lines = [FLOWS[st.category].label, 'お名前：' + p.name];
      if (p.phone) lines.push('電話：' + p.phone);
      if (p.email) lines.push('メール：' + p.email);
      if (p.clinic) lines.push('院：' + p.clinic);
      if (p.recruitRole) lines.push('希望職種：' + p.recruitRole);
      if (p.recruitLicense) lines.push('保有資格：' + p.recruitLicense);
      if (p.message) lines.push(p.message);
      typing(function () {
        bot('以下の内容で送信します。よろしければ「送信する」を押してください。\n\n' + lines.join('\n'));
        choiceButtons(['送信する', '入力し直す'], function (opt) {
          user(opt);
          if (opt === '入力し直す') { start(); return; }
          doSend(p);
        });
      });
    }

    function doSend(payload) {
      if (st.sending) return;
      st.sending = true;
      clearDock();
      bot('送信しています…');
      submitInquiry(payload).then(function () {
        st.done = true; st.sending = false;
        bot('送信が完了しました。お問い合わせありがとうございます。担当者より原則24時間以内（土日祝を除く）にご連絡いたします。');
        clearDock();
      }).catch(function (err) {
        st.sending = false;
        var msg = '送信に失敗しました。お手数ですが、時間をおいて再度お試しいただくか、お電話（06-7777-7849）でご連絡ください。';
        if (err && err.code === 'rate_limited') msg = '送信が混み合っています。1分ほどおいてから、もう一度お試しください。';
        else if (err && err.code === 'contact_required') msg = '電話番号またはメールアドレスのご入力が必要です。';
        bot(msg);
        choiceButtons(['もう一度送信する', '最初からやり直す'], function (opt) {
          user(opt);
          if (opt === '最初からやり直す') start();
          else doSend(payload);
        });
      });
    }

    function openPanel() {
      root.classList.add('open');
      document.body.classList.add('nchat-open');
      updateStatus();
      if (!log.children.length) start();
    }
    function closePanel() {
      root.classList.remove('open');
      document.body.classList.remove('nchat-open');
    }

    fab.addEventListener('click', function () { root.classList.contains('open') ? closePanel() : openPanel(); });
    closeBtn.addEventListener('click', closePanel);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDrawer(); initFaq(); initReveal(); initForm();
    initProgress(); initHeader(); initBackTop(); initKenBurns(); initColumnFilter(); initToc(); initPriceSim(); initColumnSearch();
    initChat();
  });
})();


/* コラム記事の「よくある質問」を常時表示カードに整形（col-faq） */
(function(){
  function buildColFAQ(){
    var body=document.querySelector('.article-body'); if(!body) return;
    if(body.querySelector('.col-faq')) return;
    var heads=body.querySelectorAll('h2'), faqH=null;
    for(var i=0;i<heads.length;i++){ if((heads[i].textContent||'').replace(/\s/g,'')==='よくある質問'){ faqH=heads[i]; break; } }
    if(!faqH) return;
    var list=document.createElement('div'); list.className='col-faq';
    var node=faqH.nextElementSibling, terminator=null;
    while(node){
      if(node.tagName==='H2'||node.tagName==='SECTION'||(node.classList&&node.classList.contains('related'))){ terminator=node; break; }
      var next=node.nextElementSibling;
      if(node.tagName==='P'&&node.querySelector('strong')&&node.querySelector('br')){
        var q=node.querySelector('strong').textContent.trim();
        var ans='', afterBr=false;
        node.childNodes.forEach(function(cn){ if(cn.nodeName==='BR'){ afterBr=true; return; } if(afterBr){ ans += (cn.nodeType===1 ? cn.outerHTML : (cn.textContent||'')); } });
        var item=document.createElement('div'); item.className='col-faq-item';
        var qd=document.createElement('div'); qd.className='col-faq-q'; qd.innerHTML='<span class="col-faq-mk">Q</span>';
        var qt=document.createElement('span'); qt.textContent=q; qd.appendChild(qt);
        var ad=document.createElement('div'); ad.className='col-faq-a'; ad.innerHTML='<span class="col-faq-mk">A</span><span class="col-faq-at">'+ans.trim()+'</span>';
        item.appendChild(qd); item.appendChild(ad); list.appendChild(item);
        node.parentNode.removeChild(node);
      }
      node=next;
    }
    if(list.children.length){ if(terminator) terminator.parentNode.insertBefore(list, terminator); else faqH.parentNode.appendChild(list); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', buildColFAQ); else buildColFAQ();
})();

/* ============================================================
   2026-09-20  コラム刷新スクリプト（末尾に追記）
   ・一覧：チップ＋検索での絞り込み、もっと見る
   ・記事：読了プログレス、目次の現在地ハイライト
   既存処理には触れない。対象が無ければ何もしない。
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 一覧 ---------- */
  (function () {
    var grid = document.getElementById('cgrid');
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.ccard'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('.cf-chip'));
    var input = document.getElementById('col-q');
    var clear = document.querySelector('.cs-clear');
    var more  = document.getElementById('cgrid-more');
    var empty = document.getElementById('col-empty');
    var count = document.getElementById('col-count');
    var STEP = 18, shown = STEP, cat = 'all', q = '';

    function norm(s){ return (s||'').toLowerCase()
      .replace(/[\u3041-\u3096]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)+96); })
      .replace(/[\uFF01-\uFF5E]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-65248); })
      .replace(/\s+/g,''); }

    function matches(el){
      if (cat !== 'all' && el.getAttribute('data-cat') !== cat) return false;
      if (!q) return true;
      return norm(el.getAttribute('data-k')).indexOf(q) !== -1;
    }
    function render(){
      var hit = 0, i, el;
      for (i = 0; i < cards.length; i++){
        el = cards[i];
        if (matches(el)) { hit++; el.hidden = (hit > shown); }
        else { el.hidden = true; }
      }
      if (empty) empty.hidden = hit !== 0;
      if (more){
        var rest = hit - shown;
        more.hidden = rest <= 0;
        var i2 = more.querySelector('i');
        if (i2) i2.textContent = rest > 0 ? '（残り' + rest + '件）' : '';
      }
      if (count){
        if (q || cat !== 'all'){ count.hidden = false; count.textContent = hit + '件が見つかりました'; }
        else count.hidden = true;
      }
    }
    function reset(){ shown = STEP; render(); }

    chips.forEach(function (b){
      b.addEventListener('click', function (){
        chips.forEach(function (x){ x.classList.remove('is-on'); x.setAttribute('aria-pressed','false'); });
        b.classList.add('is-on'); b.setAttribute('aria-pressed','true');
        cat = b.getAttribute('data-cat'); reset();
        var bar = document.getElementById('col-filter');
        if (bar){
          var y = bar.getBoundingClientRect().top + (window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop) - 90;
          window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    });

    var t;
    if (input){
      input.addEventListener('input', function (){
        clearTimeout(t);
        t = setTimeout(function (){ q = norm(input.value); reset(); }, 140);
      });
    }
    if (clear){
      clear.addEventListener('click', function (){ if (input){ input.value=''; } q=''; reset(); if(input) input.focus(); });
    }
    if (more){
      more.addEventListener('click', function (){
        var before = cards.filter(function(c){ return !c.hidden; }).length;
        shown += STEP; render();
        var next = cards.filter(function(c){ return !c.hidden; })[before];
        if (next && next.focus) next.setAttribute('tabindex','-1'), next.focus({preventScroll:true});
      });
    }
    render();
  })();

  /* ---------- 記事：読了プログレス ---------- */
  (function () {
    var body = document.querySelector('.article-body');
    if (!body) return;
    var bar = document.createElement('div');
    bar.className = 'nb-progress';
    bar.setAttribute('aria-hidden','true');
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    var fill = bar.firstChild;
    var native = CSS && CSS.supports && CSS.supports('animation-timeline','scroll()');
    if (native || reduce) return;
    var tick = false;
    function upd(){
      var d = document.documentElement;
      var h = (d.scrollHeight - d.clientHeight) || 1;
      var y = window.pageYOffset || d.scrollTop || document.body.scrollTop || 0;
      fill.style.width = Math.max(0, Math.min(100, (y / h) * 100)) + '%';
      tick = false;
    }
    function onScroll(){ if (!tick){ tick = true; requestAnimationFrame(upd); } }
    window.addEventListener('scroll', onScroll, { passive:true });
    document.body.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onScroll, { passive:true });
    upd();
  })();

  /* ---------- 記事：目次の現在地 ---------- */
  (function () {
    var toc = document.getElementById('article-toc');
    if (!toc) return;
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a){
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var ids = Object.keys(map);
    if (!ids.length) return;
    var current = null;
    function setCur(id){
      if (id === current) return;
      current = id;
      links.forEach(function (a){
        a.classList.remove('is-current');
        if (a.parentElement) a.parentElement.classList.remove('is-current');
      });
      var a = map[id];
      if (a){ a.classList.add('is-current'); if (a.parentElement) a.parentElement.classList.add('is-current'); }
    }
    var io = new IntersectionObserver(function (entries){
      var vis = entries.filter(function (e){ return e.isIntersecting; });
      if (!vis.length) return;
      vis.sort(function (a,b){ return a.boundingClientRect.top - b.boundingClientRect.top; });
      setCur(vis[0].target.id);
    }, { rootMargin: '-96px 0px -62% 0px', threshold: 0 });
    ids.forEach(function (id){ io.observe(document.getElementById(id)); });
  })();
})();

/* ヘッダーの実測高さを CSS 変数へ（追従バーの吸着位置に使用） */
(function(){
  var h=document.querySelector('.site-header'); if(!h) return;
  var f=document.getElementById('col-filter');
  function set(){
    var hh=Math.round(h.getBoundingClientRect().height);
    if(hh>0) document.documentElement.style.setProperty('--nb-hdr', hh+'px');
    if(f){
      var c=f.querySelector('.cf-chips');
      if(c){
        var off=Math.round(c.getBoundingClientRect().top - f.getBoundingClientRect().top);
        if(off>0) document.documentElement.style.setProperty('--nb-chipoff', off+'px');
      }
    }
  }
  set();
  window.addEventListener('load', set);
  window.addEventListener('resize', set, {passive:true});
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(set);
})();


/* 本文へスキップ（キーボード操作用） 2026-09-22 */
(function(){
  if(document.querySelector(".skip-link")) return;
  var m=document.querySelector("main"); if(!m) return;
  if(!m.id) m.id="main-content";
  var a=document.createElement("a");
  a.className="skip-link"; a.href="#"+m.id; a.textContent="本文へスキップ";
  a.addEventListener("click",function(e){ e.preventDefault(); m.setAttribute("tabindex","-1"); m.focus(); m.scrollIntoView(); });
  document.body.insertBefore(a, document.body.firstChild);
})();

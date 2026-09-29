/* のびのび — 「対象になる？」かんたん診断  <div data-nb-check></div> に表示 */
(function () {
  var Q = [
    { id: 'go', t: 'おひとりで通院できますか？', s: '付き添いがあれば行ける、という場合も含めてお選びください。', o: [
      ['no', 'ひとりでの通院はむずかしい', '付き添いや車いすが必要、寝たきりなど'],
      ['hard', '通院はできるが、負担が大きい', '痛みで長く歩けない、途中で休みが必要など'],
      ['ok', '問題なく通院できる', '']
    ]},
    { id: 'sym', multi: true, t: 'どんなことでお困りですか？', s: 'あてはまるものをすべてお選びください。', o: [
      ['pain', '腰・首・肩の痛み', ''],
      ['joint', '膝など関節の痛み・こわばり', ''],
      ['numb', '手足のしびれ・神経痛', ''],
      ['para', '脳梗塞などのあとの麻痺・こわばり', ''],
      ['park', 'パーキンソン病などによる動かしにくさ', ''],
      ['other', 'そのほか・よくわからない', '']
    ]},
    { id: 'dr', t: 'かかりつけの医師はいますか？', s: '内科など、診療科は問いません。', o: [
      ['yes', 'いる（定期的に受診している）', ''],
      ['visit', '訪問診療を受けている', ''],
      ['none', 'いない・しばらく受診していない', '']
    ]},
    { id: 'area', t: 'お住まいはどちらですか？', s: 'ご自宅でも、施設でもうかがいます。', o: [
      ['kansai', '大阪府・兵庫県（尼崎・伊丹）の対応エリア', '大阪市の淀川区・東淀川区・都島区・北区・旭区、豊中・吹田・茨木・高槻・箕面・摂津・池田'],
      ['kanto', '東京都世田谷区・神奈川県（川崎市・横浜市）周辺', ''],
      ['other', 'それ以外・わからない', '']
    ]}
  ];

  function css() {
    if (document.getElementById('nbchk-css')) return;
    var s = document.createElement('style'); s.id = 'nbchk-css';
    s.textContent = [
      '.nbchk{max-width:820px;margin:0 auto;background:#fff;border-radius:28px;box-shadow:0 1px 0 var(--line,#EFE7D6),0 16px 40px rgba(120,90,20,.09);overflow:hidden}',
      '.nbchk-top{display:flex;align-items:center;gap:16px;padding:22px 32px;background:var(--gold-wash,#FDF7E6);border-bottom:1px solid var(--line,#EFE7D6)}',
      '.nbchk-step{font-size:14px;font-weight:700;letter-spacing:.08em;color:var(--gold-deep,#E5A50C);white-space:nowrap}',
      '.nbchk-bar{flex:1;height:6px;border-radius:6px;background:#F1E6C8;overflow:hidden}',
      '.nbchk-bar i{display:block;height:100%;background:var(--gold,#F2B417);border-radius:6px;transition:width .35s ease}',
      '.nbchk-body{padding:34px 32px 30px}',
      '.nbchk-q{margin:0 0 6px;font-family:var(--font-serif);font-weight:800;font-size:clamp(21px,18px + .8vw,26px);line-height:1.5;letter-spacing:.04em;color:var(--ink,#2C3138)}',
      '.nbchk-s{margin:0 0 22px;font-size:15px;line-height:1.8;color:var(--ink-soft,#4C525B)}',
      '.nbchk-opts{display:grid;gap:10px}',
      '.nbchk-opt{display:flex;align-items:center;gap:14px;width:100%;text-align:left;background:#fff;border:1.5px solid #E9DFC6;border-radius:16px;padding:16px 18px;min-height:60px;font:inherit;cursor:pointer;transition:border-color .2s,background .2s,box-shadow .2s}',
      '.nbchk-opt:hover{border-color:var(--gold,#F2B417);background:#FFFCF3}',
      '.nbchk-opt[aria-pressed="true"]{border-color:var(--gold,#F2B417);background:var(--gold-wash,#FDF7E6);box-shadow:0 0 0 3px rgba(242,180,23,.18)}',
      '.nbchk-mk{flex:0 0 26px;height:26px;border-radius:50%;border:2px solid #D9CBA6;display:grid;place-items:center;background:#fff}',
      '.nbchk-multi .nbchk-mk{border-radius:8px}',
      '.nbchk-opt[aria-pressed="true"] .nbchk-mk{border-color:var(--gold,#F2B417);background:var(--gold,#F2B417)}',
      '.nbchk-opt[aria-pressed="true"] .nbchk-mk::after{content:"";width:10px;height:6px;border-left:2.5px solid #fff;border-bottom:2.5px solid #fff;transform:translateY(-1px) rotate(-45deg)}',
      '.nbchk-ot{display:flex;flex-direction:column;gap:2px}',
      '.nbchk-ot b{font-size:17px;font-weight:700;line-height:1.5;color:var(--ink,#2C3138)}',
      '.nbchk-ot small{font-size:13.5px;line-height:1.6;color:var(--muted,#7C7E86)}',
      '.nbchk-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:24px}',
      '.nbchk-back{background:none;border:0;font:inherit;font-size:15px;font-weight:700;color:var(--ink-soft,#4C525B);padding:10px 4px;cursor:pointer}',
      '.nbchk-back[hidden]{display:none}',
      '.nbchk-next{margin-left:auto;background:var(--gold,#F2B417);color:#fff;border:0;border-radius:999px;padding:14px 30px;font:inherit;font-size:16px;font-weight:700;letter-spacing:.05em;cursor:pointer;box-shadow:0 8px 18px rgba(242,180,23,.3)}',
      '.nbchk-next:disabled{background:#E8DCBC;box-shadow:none;cursor:default}',
      '.nbchk-res-lv{display:inline-block;font-size:14px;font-weight:700;letter-spacing:.06em;border-radius:999px;padding:5px 16px;margin-bottom:14px}',
      '.lv-a{background:#E8F3E4;color:#3F6B35}.lv-b{background:var(--gold-pale,#FCF1CF);color:#8A6412}.lv-c{background:#F1EEE8;color:#6B655C}',
      '.nbchk-res-head{padding-bottom:26px;margin-bottom:26px;border-bottom:1px dashed #E6D9B8}','.nbchk-res h3{margin:0 0 14px;font-family:var(--font-serif);font-weight:800;font-size:clamp(22px,19px + .8vw,27px);line-height:1.5;letter-spacing:.04em;color:var(--ink,#2C3138)}',
      '.nbchk-res-head p{margin:0;font-size:16.5px;line-height:2;color:var(--ink-soft,#4C525B)}',
      '.nbchk-next-h{margin:0 0 16px;font-size:14px;font-weight:700;letter-spacing:.08em;color:var(--gold-deep,#E5A50C)}',
      '.nbchk-steps{list-style:none;margin:0;padding:0;counter-reset:s;display:grid;gap:0;position:relative}','.nbchk-steps::before{content:"";position:absolute;left:17px;top:18px;bottom:18px;border-left:2px dashed var(--gold-soft,#FBE6A8)}',
      '.nbchk-steps li{position:relative;counter-increment:s;display:grid;grid-template-columns:36px 1fr;gap:16px;align-items:start;padding:0 0 20px;font-size:16.5px;line-height:1.9;color:var(--ink,#2C3138)}','.nbchk-steps li:last-child{padding-bottom:0}',
      '.nbchk-steps li::before{content:counter(s);position:relative;z-index:1;width:36px;height:36px;border-radius:50%;background:var(--gold,#F2B417);box-shadow:0 0 0 5px #fff;display:grid;place-items:center;font-family:var(--font-serif);font-size:16px;font-weight:800;color:#fff;margin-top:-2px}',
      '.nbchk-cost{margin:30px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:12px}','.nbchk-cost div{background:var(--gold-wash,#FDF7E6);border-radius:18px;padding:18px 22px}','.nbchk-cost span{display:block;font-size:13.5px;font-weight:700;letter-spacing:.06em;color:var(--ink-soft,#4C525B);margin-bottom:4px}','.nbchk-cost small{display:block;grid-column:1/-1;font-size:13.5px;color:var(--muted,#7C7E86);margin-top:-2px}',
      '.nbchk-cost b{font-family:var(--font-serif);font-size:30px;font-weight:800;line-height:1.3;color:var(--gold-deep,#E5A50C)}','.nbchk-cost b i{font-style:normal;font-size:16px;margin-left:2px;color:var(--ink,#2C3138)}',
      '.nbchk-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}',
      '.nbchk-cta a{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:0 26px;border-radius:999px;font-size:16px;font-weight:700;letter-spacing:.04em;text-decoration:none}',
      '.nbchk-cta .c1{background:var(--gold,#F2B417);color:#fff;box-shadow:0 8px 18px rgba(242,180,23,.3)}',
      '.nbchk-cta .c2{background:#fff;color:var(--ink,#2C3138);border:1.5px solid #E2D6B8}',
      '.nbchk-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 20px;margin-top:26px;padding-top:20px;border-top:1px solid var(--line,#EFE7D6)}','.nbchk-note{margin:0;flex:1 1 320px;font-size:13.5px;line-height:1.85;color:var(--muted,#7C7E86)}',
      '.nbchk-redo{flex:0 0 auto;background:#fff;border:1.5px solid #E2D6B8;border-radius:999px;font:inherit;font-size:14.5px;font-weight:700;color:var(--ink,#2C3138);padding:10px 20px;min-height:44px;cursor:pointer}','.nbchk-redo:hover{border-color:var(--gold,#F2B417)}',
      '@media (max-width:640px){.nbchk-cost{grid-template-columns:1fr}.nbchk-cost b{font-size:26px}.nbchk-redo{width:100%}.nbchk{border-radius:22px}.nbchk-top{padding:16px 20px}.nbchk-body{padding:26px 20px 22px}.nbchk-opt{padding:14px 14px}.nbchk-cta a{width:100%}}'
    ].join('');
    document.head.appendChild(s);
  }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function mount(root) {
    var st = { i: 0, a: {} };
    function render() {
      if (st.i >= Q.length) return result();
      var q = Q[st.i], cur = st.a[q.id];
      var sel = q.multi ? (cur || []) : cur;
      var html = '<div class="nbchk-top"><span class="nbchk-step">質問 ' + (st.i + 1) + ' / ' + Q.length + '</span><span class="nbchk-bar"><i style="width:' + ((st.i) / Q.length * 100) + '%"></i></span></div>';
      html += '<div class="nbchk-body' + (q.multi ? ' nbchk-multi' : '') + '"><p class="nbchk-q">' + esc(q.t) + '</p><p class="nbchk-s">' + esc(q.s) + '</p><div class="nbchk-opts" role="group" aria-label="' + esc(q.t) + '">';
      q.o.forEach(function (o) {
        var on = q.multi ? sel.indexOf(o[0]) > -1 : sel === o[0];
        html += '<button type="button" class="nbchk-opt" data-v="' + o[0] + '" aria-pressed="' + on + '"><span class="nbchk-mk"></span><span class="nbchk-ot"><b>' + esc(o[1]) + '</b>' + (o[2] ? '<small>' + esc(o[2]) + '</small>' : '') + '</span></button>';
      });
      var ok = q.multi ? sel.length > 0 : !!sel;
      html += '</div><div class="nbchk-nav"><button type="button" class="nbchk-back"' + (st.i ? '' : ' hidden') + '>← 前の質問へ</button><button type="button" class="nbchk-next"' + (ok ? '' : ' disabled') + '>' + (st.i === Q.length - 1 ? '結果を見る' : '次へ') + '</button></div></div>';
      root.innerHTML = html;
      root.querySelectorAll('.nbchk-opt').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-v');
          if (q.multi) {
            var arr = (st.a[q.id] || []).slice(), k = arr.indexOf(v);
            if (k > -1) arr.splice(k, 1); else arr.push(v);
            st.a[q.id] = arr; render();
          } else { st.a[q.id] = v; st.i++; render(); }
        });
      });
      root.querySelector('.nbchk-next').addEventListener('click', function () { st.i++; render(); });
      root.querySelector('.nbchk-back').addEventListener('click', function () { st.i--; render(); });
    }
    function result() {
      var a = st.a, sym = a.sym || [];
      var covered = sym.some(function (x) { return x !== 'other'; });
      var lv, lvc, title, lead;
      if (a.go === 'ok') {
        lv = '確認が必要です'; lvc = 'lv-c';
        title = '訪問での保険利用は、むずかしい場合があります';
        lead = '医療保険で訪問を受けるには、「おひとりでの通院がむずかしいこと」が条件のひとつです。今の状態によって判断が変わることもあるので、気になる場合はご相談ください。';
      } else if (covered && a.go === 'no') {
        lv = '可能性が高いです'; lvc = 'lv-a';
        title = '医療保険で受けられる可能性が高いです';
        lead = 'おひとりでの通院がむずかしく、お困りの症状も保険の対象になりやすいものです。医師の同意書があれば、1回およそ395円（1割負担）から受けられます。';
      } else {
        lv = '条件しだいで受けられます'; lvc = 'lv-b';
        title = '条件によっては、医療保険で受けられます';
        lead = a.go === 'hard' ? '通院の負担が大きい場合も、体の状態によっては対象になります。' : '';
        lead += covered ? 'お困りの症状は、保険の対象になりやすいものです。' : '症状によっては、医師が必要と認めれば対象になることがあります。';
        lead += 'くわしい状況をうかがったうえでご案内します。';
      }
      var steps = [];
      steps.push('お電話かフォームで、体の状態と通院の様子をお聞かせください。');
      if (a.dr === 'none') steps.push('同意書のために医療機関の受診が必要です。どこで受診すればよいかも含めてご相談ください。');
      else steps.push('かかりつけの' + (a.dr === 'visit' ? '訪問診療の' : '') + '先生に同意書をお願いします。書式のご用意やお渡しは当院が段取りします。');
      steps.push('無料体験で実際に施術を受けていただき、続けるかどうかを決めていただきます。');
      if (a.area === 'other') steps.unshift('対応エリア外の可能性があります。まずはお住まいの地域をお知らせください。');
      var tel = a.area === 'kanto' ? ['0120-641-104', '0120641104', '玉川院'] : ['06-7777-7849', '0677777849', '大阪院'];
      var html = '<div class="nbchk-top"><span class="nbchk-step">診断結果</span><span class="nbchk-bar"><i style="width:100%"></i></span></div><div class="nbchk-body nbchk-res">';
      html += '<div class="nbchk-res-head"><span class="nbchk-res-lv ' + lvc + '">' + lv + '</span><h3>' + title + '</h3><p>' + lead + '</p></div>';
      html += '<p class="nbchk-next-h">次の一歩</p><ol class="nbchk-steps">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>';
      if (a.go !== 'ok') html += '<div class="nbchk-cost"><div><span>1回あたり</span><b>約395<i>円</i></b></div><div><span>週2回・ひと月</span><b>約3,160<i>円</i></b></div><small>1割負担の方の目安です。</small></div>';
      html += '<div class="nbchk-cta"><a class="c1" href="contact.html?type=trial">無料体験を申し込む</a><a class="c2" href="tel:' + tel[1] + '">' + tel[2] + 'に電話する　' + tel[0] + '</a></div>';
      html += '<div class="nbchk-foot"><p class="nbchk-note">この診断は目安です。保険が使えるかどうかは、医師の同意とご加入の健康保険の判断で決まります。受付時間 9:00〜18:00（土日祝を除く）</p>';
      html += '<button type="button" class="nbchk-redo">もう一度診断する</button></div></div>';
      root.innerHTML = html;
      root.querySelector('.nbchk-redo').addEventListener('click', function () { st = { i: 0, a: {} }; render(); });
    }
    root.classList.add('nbchk'); render();
  }
  function init() { var els = document.querySelectorAll('[data-nb-check]'); if (!els.length) return; css(); els.forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

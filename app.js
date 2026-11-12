(function () {
  var B = window.BOOK, app = document.getElementById('app'), ov = document.getElementById('ov');
  var KEY = 'eeo_v' + B.vol, S = { u: {}, speed: 1 };
  try { var raw = localStorage.getItem(KEY); if (raw) S = JSON.parse(raw); } catch (e) {}
  if (!S.u) S.u = {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function us(n) { return S.u[n] || (S.u[n] = { done: false, quiz: -1, kn: {} }); }
  function h(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  document.getElementById('bv').textContent = B.vol;
  document.getElementById('bes').textContent = B.es;
  document.title = B.es + ' — Español en Obra ' + B.vol;

  /* ---------- audio ---------- */
  var au = new Audio(), curBtn = null, token = 0;
  var ICON = '<svg viewBox="0 0 16 16"><path d="M3 1.5v13l11-6.5z"/></svg>', STOP = '<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10"/></svg>';
  function stop() { token++; au.pause(); try { speechSynthesis.cancel(); } catch (e) {} if (curBtn) { curBtn.classList.remove('on'); curBtn.innerHTML = ICON; curBtn = null; } }
  function speakFallback(text, done) {
    try {
      var u = new SpeechSynthesisUtterance(text); u.lang = 'es-MX'; u.rate = 0.9 * (S.speed || 1);
      var v = speechSynthesis.getVoices().filter(function (x) { return /^es/i.test(x.lang); })[0]; if (v) u.voice = v;
      u.onend = u.onerror = done; speechSynthesis.speak(u);
    } catch (e) { done(); }
  }
  function play(id, text, btn) {
    return new Promise(function (res) {
      stop(); var my = ++token;
      if (btn) { curBtn = btn; btn.classList.add('on'); btn.innerHTML = STOP; }
      function fin() { if (my === token && curBtn === btn && btn) { btn.classList.remove('on'); btn.innerHTML = ICON; curBtn = null; } res(my === token); }
      if (!id) return speakFallback(text, fin);
      au.src = 'audio/' + id + '.mp3'; au.playbackRate = S.speed || 1;
      au.onended = fin; au.onerror = function () { speakFallback(text, fin); };
      var p = au.play(); if (p && p.catch) p.catch(function () { fin(); });
    });
  }
  function pb(id, text) { return '<button class="play" data-a="' + (id || '') + '" data-t="' + h(text) + '" aria-label="듣기">' + ICON + '</button>'; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.play'); if (b && !b.dataset.all) { if (b.classList.contains('on')) stop(); else play(b.dataset.a, b.dataset.t, b); return; }
    var hn = e.target.closest('.hint'); if (hn) { $$('.hint.on').forEach(function (x) { x.classList.remove('on'); }); hn.classList.add('on'); play(hn.dataset.a, hn.textContent).then(function () { hn.classList.remove('on'); }); }
  });
  var sp = document.getElementById('speed');
  function spLabel() { sp.textContent = (S.speed || 1).toFixed(2).replace(/0$/, '') + '×'; }
  sp.onclick = function () { S.speed = S.speed === 1 ? 0.8 : S.speed === 0.8 ? 0.65 : 1; save(); spLabel(); }; spLabel();
  function strip(s) { return String(s).replace(/<[^>]+>/g, ''); }

  /* ---------- home ---------- */
  function home() {
    var done = B.units.filter(function (u) { return us(u.n).done; }).length, pct = Math.round(done / B.units.length * 100);
    var cards = B.units.map(function (u) {
      var st = us(u.n), nv = 0, nd = 0;
      u.secs.forEach(function (s) { if (s.t === 'VOCAB') nv += s.rows.length; if (s.t === 'DIALOG') nd++; });
      return '<a class="ucard' + (st.done ? ' done' : '') + '" href="#/u/' + u.n + '"><span class="no">UNIDAD ' + ('0' + u.n).slice(-2) + '</span><h3>' + h(u.es) + '</h3><span class="k">' + h(u.ko) + '</span><span class="w">' + h(u.where) + '</span>' +
        '<span class="st"><span class="tag">용어 ' + nv + '</span><span class="tag">대화 ' + nd + '</span>' + (st.quiz >= 0 ? '<span class="tag on">퀴즈 ' + st.quiz + '점</span>' : '') + (st.done ? '<span class="tag on">학습 완료</span>' : '') + '</span></a>';
    }).join('');
    app.innerHTML = '<div class="hero"><div class="kick">ESPAÑOL EN OBRA · ' + B.vol + '권</div><h1>' + h(B.es) + '</h1><div class="ko">' + h(B.ko) + '</div><p>' + h(B.sub) + '. 수업 전에는 용어와 표현을 미리 듣고, 수업 뒤에는 대화문 역할 연습과 퀴즈로 복습하세요.</p><span class="lv">' + h(B.level) + '</span></div>' +
      '<div class="prog"><span>학습 진도 ' + done + ' / ' + B.units.length + '</span><div class="bar"><i style="width:' + pct + '%"></i></div><span>' + pct + '%</span></div><div class="ulist">' + cards + '</div>';
  }

  /* ---------- unit ---------- */
  function secHtml(u, s, i) {
    var o = '';
    if (s.t === 'VOCAB') {
      o = '<div class="sh"><span class="lb">VOCABULARIO</span><h2>핵심 용어 ' + h(s.title) + '</h2></div><table class="vt">' + s.rows.map(function (r) {
        return '<tr><td>' + pb(r.a, r.es) + '</td><td><div class="e">' + h(r.es) + '</div><div>' + h(r.ko) + (r.en ? ' <span class="en">· ' + h(r.en) + '</span>' : '') + '</div></td><td class="nt">' + r.nt + '</td></tr>';
      }).join('') + '</table>';
    } else if (s.t === 'EXPR') {
      o = '<div class="sh"><span class="lb">EXPRESIONES</span><h2>핵심 표현 ' + h(s.title) + '</h2><span class="sp"></span><button class="btn ghost sm" data-hide>한국어 가리기</button></div><div class="exl">' + s.rows.map(function (r) {
        return r.pat ? '<div class="pat">' + r.pat + '</div>' : '<div class="ex">' + pb(r.a, r.es) + '<div><div class="e">' + h(r.es) + '</div><div class="k">' + h(r.ko) + '</div></div></div>';
      }).join('') + '</div>';
    } else if (s.t === 'DIALOG') {
      var sps = []; s.lines.forEach(function (l) { if (sps.indexOf(l.sp) < 0) sps.push(l.sp); });
      o = '<div class="sh"><span class="lb">DIÁLOGO</span><h2>' + h(s.title) + '</h2><span class="sp"></span><select data-role><option value="">역할 연습: 끄기</option>' + sps.map(function (x) { return '<option>' + h(x) + '</option>'; }).join('') + '</select>' +
        '<button class="btn ghost sm" data-hide>한국어 가리기</button><button class="btn acc sm" data-playall>▶ 전체 듣기</button></div>' + (s.set ? '<p class="dset">' + h(s.set) + '</p>' : '') + '<div class="dlg">' + s.lines.map(function (l) {
          return '<div class="ln" data-sp="' + h(l.sp) + '">' + pb(l.a, l.es) + '<span class="sp">' + h(l.sp) + '</span><div class="tx2"><div class="de">' + h(l.es) + '</div><div class="dk">' + h(l.ko) + '</div></div></div>';
        }).join('') + '</div>';
    } else if (s.t === 'ROLE') {
      o = '<div class="role"><div class="rt"><span>ROLEPLAY</span>' + h(s.title) + '</div><div class="cards"><div class="card"><b>TARJETA A</b>' + h(s.A) + '</div><div class="card b"><b>TARJETA B</b>' + h(s.B) + '</div></div>' +
        (s.hints.length ? '<div class="hints">' + s.hints.map(function (x) { return '<button class="hint" data-a="' + x.a + '">' + h(x.es) + '</button>'; }).join('') + '</div>' : '') + (s.sur ? '<div class="sur">' + h(s.sur) + '</div>' : '') + '</div>';
    } else if (s.t === 'FIG') {
      o = '<div class="sh"><span class="lb">DOCUMENTO</span><h2>도면·서식 읽기</h2></div><div class="fig"><div class="in">' + s.html + '</div></div><div class="cap">' + s.cap + '</div>';
    } else if (s.t === 'DRILL') {
      var st = us(u.n);
      o = '<div class="sh"><span class="lb">PRÁCTICA</span><h2>연습 ' + h(s.title) + '</h2></div><ol class="drill">' + s.items.map(function (it, j) {
        var k = i + '_' + j;
        return '<li data-k="' + k + '"' + (st.kn[k] ? ' class="kn"' : '') + '><span class="i">' + (j + 1) + '</span><span>' + it.q + '</span><button class="btn ghost sm" data-ans>정답 보기</button><div class="ans" hidden>' + it.a + ' <button class="btn ok sm" data-kn style="margin-left:8px">맞혔어요</button></div></li>';
      }).join('') + '</ol>';
    } else if (s.t === 'TIP') {
      o = '<div class="tip"><div class="tt">NOTA DE OBRA · ' + h(s.title) + '</div>' + s.ps.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>';
    } else if (s.t === 'TABLE') {
      o = '<div class="sh"><span class="lb">TABLA</span><h2>' + h(s.title) + '</h2></div><div class="tw"><table class="gt"><tr>' + s.head.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>' + s.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
    } else if (s.t === 'TEXT') {
      o = '<div class="sh"><span class="lb">GRAMÁTICA</span><h2>' + h(s.title) + '</h2></div>' + s.ps.map(function (p) { return '<p class="tx">' + p + '</p>'; }).join('');
    }
    return '<section class="sec" data-i="' + i + '">' + o + '</section>';
  }
  function vocabOf(u) { var v = []; u.secs.forEach(function (s) { if (s.t === 'VOCAB') v = v.concat(s.rows); }); return v; }
  function unit(n) {
    var idx = -1; B.units.forEach(function (x, i) { if (x.n === n) idx = i; }); if (idx < 0) return home();
    var u = B.units[idx], st = us(n), prev = B.units[idx - 1], next = B.units[idx + 1];
    app.innerHTML = '<div class="uh"><div class="n">UNIDAD ' + ('0' + u.n).slice(-2) + '</div><div class="t"><h1>' + h(u.es) + '</h1><div class="k">' + h(u.ko) + '</div></div></div>' +
      '<div class="scene"><div class="w"><span>현장 설정</span>' + h(u.where) + '</div><p>' + h(u.scene) + '</p></div><ul class="goals">' + u.goals.map(function (g) { return '<li>' + h(g) + '</li>'; }).join('') + '</ul>' +
      '<div class="acts"><button class="btn" id="bfc">용어 플래시카드</button><button class="btn acc" id="bqz">용어 퀴즈' + (st.quiz >= 0 ? ' · 최고 ' + st.quiz + '점' : '') + '</button><button class="btn ' + (st.done ? 'ok' : 'ghost') + '" id="bdn">' + (st.done ? '✓ 학습 완료' : '학습 완료로 표시') + '</button></div>' +
      u.secs.map(function (s, i) { return secHtml(u, s, i); }).join('') +
      '<div class="navu">' + (prev ? '<a class="btn ghost" href="#/u/' + prev.n + '">← ' + h(prev.es) + '</a>' : '<span></span>') + (next ? '<a class="btn" href="#/u/' + next.n + '">' + h(next.es) + ' →</a>' : '<a class="btn" href="#/">단원 목록 →</a>') + '</div>';
    var voc = vocabOf(u);
    $('#bfc').onclick = function () { flash(u, voc); }; $('#bqz').onclick = function () { quiz(u, voc); };
    if (!voc.length) { $('#bfc').hidden = true; $('#bqz').hidden = true; }
    $('#bdn').onclick = function () { st.done = !st.done; save(); unit(n); };
    $$('[data-hide]').forEach(function (b) { b.onclick = function () { var sec = b.closest('.sec'); var on = sec.classList.toggle('hideko'); b.textContent = on ? '한국어 보기' : '한국어 가리기'; $$('.show', sec).forEach(function (x) { x.classList.remove('show'); }); }; });
    app.onclick = function (e) {
      var k = e.target.closest('.hideko .k, .hideko .dk'); if (k) k.classList.toggle('show');
      var m = e.target.closest('.ln.mine'); if (m && !e.target.closest('.play')) m.classList.toggle('show');
      var a = e.target.closest('[data-ans]'); if (a) { var d = a.parentNode.querySelector('.ans'); d.hidden = !d.hidden; a.textContent = d.hidden ? '정답 보기' : '정답 숨기기'; }
      var kn = e.target.closest('[data-kn]'); if (kn) { var li = kn.closest('li'); st.kn[li.dataset.k] = 1; li.classList.add('kn'); save(); }
    };
    $$('[data-role]').forEach(function (sel) { sel.onchange = function () { $$('.ln', sel.closest('.sec')).forEach(function (l) { l.classList.remove('show'); l.classList.toggle('mine', !!sel.value && l.dataset.sp === sel.value); }); }; });
    $$('[data-playall]').forEach(function (b) {
      b.onclick = function () {
        var sec = b.closest('.sec'), lines = $$('.ln', sec);
        if (b.dataset.on) { delete b.dataset.on; b.textContent = '▶ 전체 듣기'; stop(); lines.forEach(function (l) { l.classList.remove('cur'); }); return; }
        b.dataset.on = 1; b.textContent = '■ 정지'; var i = 0;
        (function nextLine() {
          lines.forEach(function (l) { l.classList.remove('cur'); });
          if (!b.dataset.on || i >= lines.length) { delete b.dataset.on; b.textContent = '▶ 전체 듣기'; return; }
          var l = lines[i++], pbn = $('.play', l); l.classList.add('cur'); l.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          if (l.classList.contains('mine')) { var wait = Math.max(2500, $('.de', l).textContent.length * 90); stop(); var my = ++token; setTimeout(function () { if (my === token && b.dataset.on) nextLine(); }, wait); }
          else play(pbn.dataset.a, pbn.dataset.t, pbn).then(function (ok) { if (ok && b.dataset.on) setTimeout(nextLine, 350); else if (b.dataset.on) { delete b.dataset.on; b.textContent = '▶ 전체 듣기'; l.classList.remove('cur'); } });
        })();
      };
    });
    window.scrollTo(0, 0);
  }

  /* ---------- overlays ---------- */
  function open(html) { ov.innerHTML = '<div class="box"><button class="x" aria-label="닫기">×</button>' + html + '</div>'; ov.hidden = false; $('.x', ov).onclick = close; }
  function close() { stop(); ov.hidden = true; ov.innerHTML = ''; }
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function flash(u, voc) {
    var deck = shuffle(voc), i = 0, back = false;
    function draw() {
      var c = deck[i];
      open('<h3>용어 플래시카드</h3><div class="cnt">UNIDAD ' + u.n + ' · ' + (i + 1) + ' / ' + deck.length + '</div><div class="fc" id="fc">' + (back ? '<div class="fe">' + h(c.es) + '</div><div class="fk">' + h(c.ko) + '</div><div class="fn">' + (c.en ? h(c.en) + '<br>' : '') + c.nt + '</div>' : '<div class="fk">' + h(c.ko) + '</div><small>눌러서 스페인어 확인</small>') + '</div>' +
        '<div class="row"><button class="btn ghost" id="fp">← 이전</button><button class="btn" id="fl">▶ 듣기</button><button class="btn acc" id="fn">다음 →</button></div>');
      $('#fc').onclick = function () { back = !back; draw(); if (back) play(c.a, c.es); };
      $('#fl').onclick = function () { play(c.a, c.es); };
      $('#fp').onclick = function () { i = (i + deck.length - 1) % deck.length; back = false; draw(); };
      $('#fn').onclick = function () { i = (i + 1) % deck.length; back = false; draw(); };
    }
    draw();
  }
  function quiz(u, voc) {
    var qs = shuffle(voc).slice(0, Math.min(10, voc.length)), i = 0, score = 0;
    function draw() {
      if (i >= qs.length) {
        var pt = Math.round(score / qs.length * 100), st = us(u.n); if (pt > st.quiz) { st.quiz = pt; save(); var bq = document.getElementById('bqz'); if (bq) bq.textContent = '용어 퀴즈 · 최고 ' + pt + '점'; }
        open('<h3>용어 퀴즈 결과</h3><div class="res"><div class="big">' + pt + '점</div><p>' + qs.length + '문제 중 ' + score + '문제 정답</p></div><div class="row"><button class="btn acc" id="qa">다시 풀기</button><button class="btn ghost" id="qc">닫기</button></div>');
        $('#qa').onclick = function () { quiz(u, voc); }; $('#qc').onclick = close; return;
      }
      var c = qs[i], rev = i % 2 === 1, pool = shuffle(voc.filter(function (x) { return x !== c && x.ko !== c.ko; })).slice(0, 3), opts = shuffle(pool.concat([c]));
      open('<h3>용어 퀴즈</h3><div class="cnt">UNIDAD ' + u.n + ' · ' + (i + 1) + ' / ' + qs.length + ' · ' + (rev ? '뜻에 맞는 스페인어를 고르세요' : '스페인어의 뜻을 고르세요') + '</div><div class="q">' + (rev ? h(c.ko) : pb(c.a, c.es) + h(c.es)) + '</div><div class="opts">' +
        opts.map(function (o, k) { return '<button class="opt" data-k="' + k + '">' + h(rev ? o.es : o.ko) + '</button>'; }).join('') + '</div>');
      if (!rev) play(c.a, c.es);
      $$('.opt', ov).forEach(function (b) {
        b.onclick = function () {
          if ($('.opt.r', ov)) return; var ok = opts[+b.dataset.k] === c; if (ok) score++; else b.classList.add('w');
          $$('.opt', ov)[opts.indexOf(c)].classList.add('r'); if (rev) play(c.a, c.es);
          setTimeout(function () { i++; draw(); }, ok ? 900 : 1800);
        };
      });
    }
    draw();
  }

  /* ---------- glossary ---------- */
  function glos() {
    var all = []; B.units.forEach(function (u) { vocabOf(u).forEach(function (r) { all.push({ r: r, n: u.n }); }); });
    all.sort(function (a, b) { return a.r.es.replace(/^(el|la|los|las) /, '').localeCompare(b.r.es.replace(/^(el|la|los|las) /, ''), 'es'); });
    app.innerHTML = '<div class="sh"><span class="lb">GLOSARIO</span><h2>용어 찾기 · ' + all.length + '개</h2></div><input class="search" id="gq" placeholder="스페인어, 한국어, 영어로 검색" autocomplete="off"><table class="vt" id="gt"></table>';
    function draw(q) {
      q = q.trim().toLowerCase();
      var rows = all.filter(function (x) { return !q || (x.r.es + ' ' + x.r.ko + ' ' + x.r.en + ' ' + strip(x.r.nt)).toLowerCase().indexOf(q) >= 0; }).slice(0, 400);
      $('#gt').innerHTML = rows.map(function (x) { var r = x.r; return '<tr><td>' + pb(r.a, r.es) + '</td><td><div class="e">' + h(r.es) + '</div><div>' + h(r.ko) + (r.en ? ' <span class="en">· ' + h(r.en) + '</span>' : '') + '</div></td><td class="nt">' + r.nt + ' <a class="tag" href="#/u/' + x.n + '">U' + ('0' + x.n).slice(-2) + '</a></td></tr>'; }).join('') || '<tr><td colspan="3">검색 결과가 없습니다.</td></tr>';
    }
    $('#gq').oninput = function () { draw(this.value); }; draw(''); window.scrollTo(0, 0);
  }

  function route() {
    stop(); app.onclick = null;
    var m = location.hash.match(/^#\/u\/(\d+)/);
    if (m) unit(+m[1]); else if (/^#\/glosario/.test(location.hash)) glos(); else { home(); window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', function () { if (!ov.hidden) close(); route(); });
  route();
})();

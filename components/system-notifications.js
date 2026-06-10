/* System notifications stream — пуши «ОК» приходят один за другим
   на стартовый экран и продолжают приходить, когда пользователь
   зашёл в приложение (например, на /lenta-light.html).

   Состояние стрима хранится в sessionStorage:
     ok_notif_idx     — индекс следующего пуша в очереди NOTIFS
     ok_notif_next_at — epoch-ms, когда должен прилететь следующий пуш

   Карточки рендерятся в контейнер #notifs (присутствует на каждой
   странице, где должны показываться пуши).

   API: window.OkNotifs.start() / .stop(clear) / .reset() */
(function (global) {
  var NOTIFS = [
    { sender: 'Сергей Федоров', time: '15 мин назад', body: 'Добавил новую заметку «Ездил недавно в отпуск на Алтай, посмотрите»' },
    { sender: 'Алена Смирнова', time: '2 ч назад',   body: 'Сменила главное фото' },
    { sender: 'Максим Ясный',   time: '3 ч назад',   body: 'Добавил новое видео' }
  ];
  var NOTIF_GAP      = 6000;   // 6s между пушами
  var NOTIF_FIRST    = 2000;   // первый — через 2s после старта
  var NOTIF_LIFETIME = 10000;  // карточка сама уходит через 10s
  var MAX_STACK      = 3;      // сколько карточек одновременно видно

  var IDX_KEY  = 'ok_notif_idx';
  var NEXT_KEY = 'ok_notif_next_at';

  var timer = null;

  function box()  { return document.getElementById('notifs'); }
  function now()  { return Date.now(); }

  function getIdx() {
    try { return parseInt(sessionStorage.getItem(IDX_KEY) || '0', 10) || 0; }
    catch (e) { return 0; }
  }
  function setIdx(v) {
    try { sessionStorage.setItem(IDX_KEY, String(v)); } catch (e) {}
  }
  function getNextAt() {
    try { return parseInt(sessionStorage.getItem(NEXT_KEY) || '0', 10) || 0; }
    catch (e) { return 0; }
  }
  function setNextAt(v) {
    try {
      if (v) sessionStorage.setItem(NEXT_KEY, String(v));
      else   sessionStorage.removeItem(NEXT_KEY);
    } catch (e) {}
  }

  function dismiss(el) {
    if (!el || el.__leaving) return;
    el.__leaving = true;
    if (el.__hideTimer) { clearTimeout(el.__hideTimer); el.__hideTimer = null; }
    el.style.transition = 'transform 0.28s ease, opacity 0.28s ease';
    el.style.transform  = 'translateY(-150%)';
    el.style.opacity    = '0';
    var done = function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      restack();
    };
    el.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 360);
  }

  function restack() {
    var b = box(); if (!b) return;
    var kids = b.children, visible = [];
    for (var i = 0; i < kids.length; i++) {
      if (!kids[i].__leaving) visible.push(kids[i]);
    }
    var n = visible.length;
    for (var j = 0; j < n; j++) {
      var el = visible[j];
      var depth = n - 1 - j;
      if (depth >= MAX_STACK) { dismiss(el); continue; }
      el.style.transition = 'transform 0.38s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.3s ease';
      el.style.zIndex     = String(100 - depth);
      el.style.opacity    = depth === 0 ? '1' : (depth === 1 ? '0.92' : '0.8');
      el.style.transform  = 'translateY(' + (depth * 10) + 'px) scale(' + (1 - depth * 0.05) + ')';
    }
  }

  function attachSwipe(el) {
    var sy = 0, dy = 0, dragging = false;
    el.addEventListener('pointerdown', function (e) {
      if (el.__leaving) return;
      dragging = true; sy = e.clientY; dy = 0;
      el.style.transition = 'none';
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dy = Math.min(0, e.clientY - sy);
      el.style.transform = 'translateY(' + dy + 'px)';
      el.style.opacity   = String(Math.max(0, 1 + dy / 120));
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      if (dy < -34) dismiss(el);
      else          restack();
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function addNotif(data) {
    var b = box(); if (!b) return;
    var el = document.createElement('div');
    el.className = 'notif';
    el.innerHTML =
      '<div class="notif__head">' +
        '<span class="notif__appicon"><svg width="12" height="12" viewBox="0 0 100 100" fill="none">' +
          '<circle cx="50" cy="34" r="13" fill="#fff"/>' +
          '<path d="M38 44 L50 64 L38 84" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="M62 44 L50 64 L62 84" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg></span>' +
        '<span class="notif__app"></span>' +
        '<span class="notif__sep">·</span>' +
        '<span class="notif__time"></span>' +
      '</div>' +
      '<div class="notif__body"></div>';
    el.querySelector('.notif__app').textContent  = data.sender;
    el.querySelector('.notif__time').textContent = data.time;
    el.querySelector('.notif__body').textContent = data.body;
    b.appendChild(el);
    attachSwipe(el);
    // приходим над стопкой и опускаемся в положение спереди
    el.style.transition = 'none';
    el.style.transform  = 'translateY(-46px) scale(1)';
    el.style.opacity    = '0';
    void el.offsetWidth;
    restack();
    el.__hideTimer = setTimeout(function () { dismiss(el); }, NOTIF_LIFETIME);
  }

  function scheduleAt(when) {
    if (timer) { clearTimeout(timer); timer = null; }
    var delay = Math.max(0, when - now());
    timer = setTimeout(tick, delay);
  }

  function tick() {
    timer = null;
    var idx = getIdx();
    if (idx >= NOTIFS.length) { setNextAt(0); return; }
    addNotif(NOTIFS[idx]);
    idx++;
    setIdx(idx);
    if (idx >= NOTIFS.length) { setNextAt(0); return; }
    var nextAt = now() + NOTIF_GAP;
    setNextAt(nextAt);
    scheduleAt(nextAt);
  }

  function start() {
    if (!box()) return;
    if (timer) return;
    var idx = getIdx();
    if (idx >= NOTIFS.length) return;
    var nextAt = getNextAt();
    if (!nextAt) {
      nextAt = now() + NOTIF_FIRST;
      setNextAt(nextAt);
    }
    scheduleAt(nextAt);
  }

  function stop(clear) {
    if (timer) { clearTimeout(timer); timer = null; }
    if (clear) {
      var b = box();
      if (b) {
        for (var i = 0; i < b.children.length; i++) {
          var el = b.children[i];
          if (el.__hideTimer) clearTimeout(el.__hideTimer);
        }
        b.innerHTML = '';
      }
      reset();
    }
  }

  function reset() {
    setIdx(0);
    setNextAt(0);
  }

  global.OkNotifs = { start: start, stop: stop, reset: reset };
})(window);

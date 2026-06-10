/**
 * OK Design System (proto) — ScreenTransition
 *
 * Системный push/pop между экранами-страницами.
 *   [data-screen]       — корень экрана (анимируется).
 *   [data-screen-back]  — кнопка «назад» в навбаре (опц. data-href, иначе history.back()).
 *
 * Направление входа передаётся между страницами через sessionStorage:
 *   back  → экран въезжает слева (pop), forward → справа (push).
 */
(function () {
  var KEY = 'screenNavDir';
  function root() { return document.querySelector('[data-screen]'); }

  // Анимация входа экрана (на загрузке / возврате из bfcache)
  function playEnter() {
    var r = root();
    if (!r) return;
    var dir = null;
    try { dir = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {}
    var cls = dir === 'back' ? 'screen-enter-back' : 'screen-enter-forward';
    r.classList.remove('screen-enter-forward', 'screen-enter-back', 'screen-leave-back');
    void r.offsetWidth;
    r.classList.add(cls);
    r.addEventListener('animationend', function () { r.classList.remove(cls); }, { once: true });
  }

  // Тап по «назад» в навбаре → уезжаем вправо, затем переход.
  // Централизованно ловим стандартную кнопку навбара .nav-bar__back
  // (button-inline с иконкой назад) — на странице ничего прокидывать не нужно.
  // По умолчанию history.back(); опц. data-href переопределяет цель.
  document.addEventListener('click', function (e) {
    var back = e.target.closest ? e.target.closest('.nav-bar__back, [data-screen-back]') : null;
    if (!back) return;
    var r = root();
    if (!r) return;
    e.preventDefault();
    var href = back.getAttribute('data-href');
    try { sessionStorage.setItem(KEY, 'back'); } catch (er) {}

    var done = false;
    function go() { if (done) return; done = true; if (href) location.href = href; else history.back(); }

    r.classList.add('screen-leave-back');
    r.addEventListener('animationend', go, { once: true });
    setTimeout(go, 360);   // фолбэк, если animationend не пришёл
  });

  window.addEventListener('pageshow', playEnter);
})();

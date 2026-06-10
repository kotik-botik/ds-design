/**
 * OK Design System (proto) — ScreenTransition
 *
 * Поведение кнопки «назад» в навбаре. Анимацию перехода даёт нативный
 * View Transitions API (см. components/screen-transition.css).
 *
 *   .nav-bar__back     — стандартная навбар-кнопка назад → history.back()
 *   [data-screen-back] — явный хук (опц. data-href переопределяет цель)
 *
 * Привязка централизованная: на странице достаточно поставить кнопку
 * с классом nav-bar__back — ничего прокидывать не нужно.
 */
(function () {
  document.addEventListener('click', function (e) {
    var back = e.target.closest ? e.target.closest('.nav-bar__back, [data-screen-back]') : null;
    if (!back) return;
    e.preventDefault();
    var href = back.getAttribute('data-href');
    if (href) location.href = href;
    else history.back();
  });
})();

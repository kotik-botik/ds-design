/**
 * OK Design System (proto) — ScreenTransition
 *
 * Проставляет тип View Transition ('forward' / 'back') по направлению навигации
 * (Navigation API) и централизованно обрабатывает кнопку «назад» в навбаре.
 *
 *   .nav-bar__back     — стандартная навбар-кнопка назад → history.back()
 *   [data-screen-back] — явный хук (опц. data-href переопределяет цель)
 *
 * Анимацию задаёт components/screen-transition.css. Без поддержки
 * View Transitions / Navigation API — навигация мгновенная, без рывка.
 */
(function () {
  // back, если это traverse на запись с меньшим индексом (история назад)
  function isBack(activation) {
    if (!activation || activation.navigationType !== 'traverse') return false;
    var from = activation.from, to = activation.entry;
    if (from && to && typeof from.index === 'number' && typeof to.index === 'number') {
      return to.index < from.index;
    }
    return false;
  }

  function tagType(viewTransition, activation) {
    if (!viewTransition || !viewTransition.types) return;
    viewTransition.types.add(isBack(activation) ? 'back' : 'forward');
  }

  // Исходящая страница (старый снимок)
  window.addEventListener('pageswap', function (e) {
    if (e.viewTransition) tagType(e.viewTransition, e.activation);
  });

  // Входящая страница (новый снимок)
  window.addEventListener('pagereveal', function (e) {
    if (e.viewTransition) tagType(e.viewTransition, window.navigation && window.navigation.activation);
  });

  // Кнопка «назад» в навбаре — централизованно
  document.addEventListener('click', function (e) {
    var back = e.target.closest ? e.target.closest('.nav-bar__back, [data-screen-back]') : null;
    if (!back) return;
    e.preventDefault();
    var href = back.getAttribute('data-href');
    if (href) location.href = href;
    else history.back();
  });
})();

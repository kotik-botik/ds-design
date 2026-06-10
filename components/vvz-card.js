/**
 * OK Design System (proto) — VvzCard behaviour
 *
 * Контейнер: [data-vvz]. Внутри карточки .vvz-card.
 *  - [data-vvz-hide]      на крестике карточки → карточка исчезает;
 *                         когда удалена последняя — удаляется весь контейнер.
 *  - [data-vvz-hide-all]  на «Скрыть» → скрывается весь контейнер.
 */
(function () {
  function container(el) { return el.closest('[data-vvz]'); }

  function removeContainer(c) {
    if (!c) return;
    c.classList.add('__leaving');
    setTimeout(function () { c.remove(); }, 500);
  }

  function removeCard(card) {
    if (!card) return;
    var c = container(card);
    // Последняя карточка — гасим весь контейнер целиком (один плавный фейд)
    if (c && c.querySelectorAll('.vvz-card').length <= 1) {
      removeContainer(c);
      return;
    }
    card.classList.add('__leaving');
    setTimeout(function () { card.remove(); }, 500);
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;

    var hideAll = e.target.closest('[data-vvz-hide-all]');
    if (hideAll) { removeContainer(container(hideAll)); return; }

    var hide = e.target.closest('[data-vvz-hide]');
    if (hide) { removeCard(e.target.closest('.vvz-card')); }
  });
})();

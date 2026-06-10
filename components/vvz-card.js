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

  function removeContainer(c) { if (c) c.remove(); }

  function removeCard(card) {
    if (!card) return;
    var c = container(card);
    card.classList.add('__leaving');
    setTimeout(function () {
      card.remove();
      if (c && c.querySelectorAll('.vvz-card').length === 0) removeContainer(c);
    }, 200);
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;

    var hideAll = e.target.closest('[data-vvz-hide-all]');
    if (hideAll) { removeContainer(container(hideAll)); return; }

    var hide = e.target.closest('[data-vvz-hide]');
    if (hide) { removeCard(e.target.closest('.vvz-card')); }
  });
})();

/**
 * OK Design System (proto) — VvzCard JS
 *
 * Helper-фабрика для DS-карточки «Возможно, вы знакомы» (см. vvz-card.css).
 * Используется в любом проекте, где есть ВВЗ-сториз или ряд ВВЗ-предложений.
 *
 *   var html = VvzCard.render({
 *     name:    'Карина Затонская',
 *     sub:     '28 лет, Рига',           // используется, если mutuals нет
 *     img:     'https://…/avatar.jpg',
 *     mutuals: 18,                       // опц.: количество общих друзей
 *     m:       [44, 12, 5]               // опц.: id 3 аватарок для стека
 *   });
 *
 * Dismiss-поведение: при клике на ✕ внутри карточки на корне ставится класс
 * .__state-hidden, контент сменяется на «Рекомендация скрыта». Слушатель —
 * делегированный на document, навешивается один раз при загрузке скрипта.
 */
(function () {
  function avatarHtml(id) {
    return '<div class="avatar __size-32 __type-image">' +
             '<img src="https://i.pravatar.cc/64?img=' + id + '" alt="">' +
           '</div>';
  }

  function render(p) {
    if (!p) return '';
    var hasMutuals = p.mutuals && p.m && p.m.length;
    var mutAvas = hasMutuals ? p.m.map(avatarHtml).join('') : '';
    var subtitle = hasMutuals ? (p.mutuals + ' общих друзей') : (p.sub || '');
    return [
      '<div class="vvz-card' + (hasMutuals ? ' __has-mutuals' : '') + '" data-vvz-card>',
        '<span class="vvz-card__close button-inline-wrapper __size-16 __view-secondary">',
          '<button class="button-inline __size-16" aria-label="Скрыть" data-vvz-dismiss>',
            '<span class="button-inline__content">',
              '<span class="button-inline__icon icon __size-16 __slot-close"></span>',
            '</span>',
          '</button>',
        '</span>',
        '<div class="vvz-card__media"><img src="' + (p.img || '') + '" alt=""></div>',
        '<div class="vvz-card__content">',
          '<div class="vvz-card__title ds-title-s">' + (p.name || '') + '</div>',
          '<div class="vvz-card__subtitle ds-caption-m">' + subtitle + '</div>',
          '<div class="vvz-card__mutuals">',
            '<div class="avatars-view __size-32">',
              '<div class="avatars-view__stack">' + mutAvas + '</div>',
            '</div>',
          '</div>',
          '<div class="vvz-card__btn button-wrapper __size-36 __style-primary">',
            '<button class="button-container __style-primary" type="button">',
              '<span class="button-content">Дружить</span>',
            '</button>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }

  // Делегированный listener — один на весь документ. Работает с любыми
  // карточками .vvz-card (включая динамически вставленные через innerHTML).
  // При dismiss карточка переходит в состояние «Подобрали для вас» (по макету
  // ВВЗ-сториз): аватар и имя остаются, сабтайтл подменяется, всё остальное
  // скрывается через CSS .__state-hidden.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-vvz-dismiss]');
    if (!btn) return;
    e.stopPropagation();
    var card = btn.closest('[data-vvz-card]');
    if (!card) return;
    card.classList.add('__state-hidden');
    var sub = card.querySelector('.vvz-card__subtitle');
    if (sub) sub.textContent = 'Подобрали для вас';
  });

  window.VvzCard = { render: render };
})();

/**
 * OK Design System — TabBar navigation
 *
 * Привязывает переходы к иконкам таббара (.tabbar-icon).
 * Приоритет: явный data-href на кнопке → дефолтная карта по слоту.
 * Повторный тап на активный __slot-menu открывает шторку-менюшку.
 * Подключение: <script src="components/tab-bar.js"></script> на странице с .tabbar.
 */
(function () {
  // Слот → страница по умолчанию
  var ROUTES = {
    feed: 'lenta-q3.html',
    book: 'tribune.html',
    message: 'messages.html',
    menu: 'menu.html'
  };

  var SHEET_ITEMS = [
    { label: 'Оповещения', icon: 'notifications_24.svg', badge: '4', href: null },
    { label: 'События',    icon: 'events_24.svg',        badge: '5', href: null },
    { label: 'Гости',      icon: 'guests_24.svg',        badge: '1', href: 'guests.html' },
    { label: 'Друзья',     icon: 'users_24.svg',         badge: null, href: 'friends.html' },
    { label: 'Фото',       icon: 'photo_24.svg',         badge: null, href: null },
    { label: 'Видео',      icon: 'video_24.svg',         badge: null, href: null },
    { label: 'Группы',     icon: 'klass_groups_24.svg',  badge: null, href: null },
    { label: 'Подарки',    icon: 'gift_24.svg',          badge: null, href: 'gifts-catalog.html' }
  ];

  function iconBase() {
    /* Путь к assets/ относительно текущей страницы — всегда в корне. */
    return 'assets/icons/';
  }

  function buildSheet() {
    var backdrop = document.createElement('div');
    backdrop.className = 'tabbar-menu-sheet__backdrop';

    var sheet = document.createElement('div');
    sheet.className = 'tabbar-menu-sheet';

    var handle = document.createElement('div');
    handle.className = 'tabbar-menu-sheet__handle';
    sheet.appendChild(handle);

    var grid = document.createElement('div');
    grid.className = 'tabbar-menu-sheet__grid';

    SHEET_ITEMS.forEach(function (item) {
      var tag = item.href ? 'a' : 'button';
      var el = document.createElement(tag);
      el.className = 'tabbar-menu-sheet__item';
      if (item.href) { el.href = item.href; el.setAttribute('data-sheet-nav', '1'); }
      else           { el.type = 'button'; }

      var tile = document.createElement('span');
      tile.className = 'tabbar-menu-sheet__tile';

      var img = document.createElement('img');
      img.src = iconBase() + item.icon;
      img.width = 28; img.height = 28; img.alt = '';
      tile.appendChild(img);

      if (item.badge) {
        var badge = document.createElement('span');
        badge.className = 'tabbar-menu-sheet__badge';
        badge.textContent = item.badge;
        tile.appendChild(badge);
      }

      var label = document.createElement('span');
      label.className = 'tabbar-menu-sheet__label';
      label.textContent = item.label;

      el.appendChild(tile);
      el.appendChild(label);
      grid.appendChild(el);
    });

    sheet.appendChild(grid);
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    /* Закрыть по бэкдропу */
    backdrop.addEventListener('click', closeSheet);

    /* Свайп вниз по шторке для закрытия */
    var sy = 0, dy = 0, draggingSheet = false;
    sheet.addEventListener('pointerdown', function (e) {
      /* Свайп только сверху (handle-зона) */
      var r = sheet.getBoundingClientRect();
      if (e.clientY - r.top > 40) return;
      draggingSheet = true;
      sy = e.clientY; dy = 0;
      try { sheet.setPointerCapture(e.pointerId); } catch (_) {}
    });
    sheet.addEventListener('pointermove', function (e) {
      if (!draggingSheet) return;
      dy = e.clientY - sy;
      if (dy > 0) sheet.style.transform = 'translateY(' + dy + 'px)';
    });
    function endSheetDrag() {
      if (!draggingSheet) return;
      draggingSheet = false;
      sheet.style.transform = '';
      if (dy > 60) closeSheet();
    }
    sheet.addEventListener('pointerup', endSheetDrag);
    sheet.addEventListener('pointercancel', endSheetDrag);

    return { sheet: sheet, backdrop: backdrop };
  }

  var _sheet = null;

  function openSheet() {
    if (!_sheet) _sheet = buildSheet();
    requestAnimationFrame(function () {
      _sheet.sheet.classList.add('__open');
      _sheet.backdrop.classList.add('__open');
    });
  }

  function closeSheet() {
    if (!_sheet) return;
    _sheet.sheet.classList.remove('__open');
    _sheet.backdrop.classList.remove('__open');
  }

  function hrefFor(btn) {
    var explicit = btn.getAttribute('data-href');
    if (explicit) return explicit;
    for (var slot in ROUTES) {
      if (btn.classList.contains('__slot-' + slot)) return ROUTES[slot];
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.tabbar-icon') : null;
    if (!btn) return;

    if (btn.classList.contains('__state-on')) {
      /* Повторный тап на активный меню-таб → перейти на menu.html */
      if (btn.classList.contains('__slot-menu')) {
        sessionStorage.setItem('nav-tab', '1');
        location.href = ROUTES.menu;
      }
      return;
    }

    /* Закрыть шторку при переходе на другой таб */
    closeSheet();

    var href = hrefFor(btn);
    if (href) {
      sessionStorage.setItem('nav-tab', '1');
      location.href = href;
    }
  });

  /* ---- Home-indicator swipe-up: жест по .tabbar__handle.
     Свайп вверх на > 40px = «свернуть приложение» → start.html. ---- */
  var handle = document.querySelector('.tabbar__handle');
  if (handle) {
    var sy = 0, dy = 0, dragging = false;

    handle.addEventListener('pointerdown', function (e) {
      dragging = true;
      sy = e.clientY;
      dy = 0;
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    });

    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dy = e.clientY - sy;
    });

    function endGesture() {
      if (!dragging) return;
      dragging = false;
      if (dy < -40) location.href = 'start.html';
    }
    handle.addEventListener('pointerup', endGesture);
    handle.addEventListener('pointercancel', endGesture);
  }
})();

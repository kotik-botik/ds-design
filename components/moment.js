/**
 * OK Design System (proto) — Moment viewer behavior
 *
 * Поведение полноэкранного просмотрщика сториз.
 *  - тап левой половины  → prev (или возврат к началу текущего)
 *  - тап правой половины → next
 *  - автопродвижение по CSS-таймеру (длительность из --moment-duration)
 *  - событие 'moment:viewed' на корне после досмотра последнего сегмента
 *
 * USAGE:
 *   MomentViewer.init(rootEl, {
 *     onChange: (index) => { … },        // опц.: при смене активного сегмента
 *     onNext:   () => true | false,      // тап вправо/таймер за последним
 *                                        //   сегментом. true → компонент НЕ
 *                                        //   закрывается, страница сама
 *                                        //   подменила контент (см. setSlides).
 *     onPrev:   () => true | false,      // тап влево на первом сегменте.
 *                                        //   true → страница перешла к
 *                                        //   предыдущему автору.
 *     onClose:  () => { … },             // явное закрытие (Esc/✕) или досмотр
 *                                        //   последней сториз последнего
 *                                        //   автора. Тут лента ставит ✕ и
 *                                        //   .__ring-viewed аватарке.
 *   });
 *
 * Сколько палочек прогресса — столько и «сториз». Количество и список картинок
 * задаются снаружи: при первом init либо через `slides`, либо просто разметкой
 * .moment__progress-segment в HTML. На переходе между авторами страница
 * вызывает instance.setSlides(newSlides) — viewer пересоберёт сегменты.
 */
(function () {
  function MomentViewer(root, options) {
    this.root = root;
    this.options = options || {};
    this.slides = null;
    this.current = 0;

    this._onPrev = this._onPrev.bind(this);
    this._onNext = this._onNext.bind(this);
    this._onAnimEnd = this._onAnimEnd.bind(this);
    this._onKey = this._onKey.bind(this);

    this._prev = root.querySelector('.moment__nav-zone.__side-prev');
    this._next = root.querySelector('.moment__nav-zone.__side-next');
    if (this._prev) this._prev.addEventListener('click', this._onPrev);
    if (this._next) this._next.addEventListener('click', this._onNext);

    // Завершение анимации активного сегмента → автоматический next
    root.addEventListener('animationend', this._onAnimEnd);

    document.addEventListener('keydown', this._onKey);

    // Если slides переданы в опциях — сразу собираем сегменты прогресс-бара.
    // Если нет — компонент работает с уже разложенными в HTML сегментами.
    if (this.options.slides) {
      this.setSlides(this.options.slides);
    } else {
      this.segments = Array.prototype.slice.call(
        root.querySelectorAll('.moment__progress-segment')
      );
    }

    this.go(0);
  }

  MomentViewer.prototype.go = function (index) {
    if (index < 0) {
      // Выход за левую границу — спрашиваем страницу, переходить ли к
      // предыдущему автору. Если страница вернёт true — она сама вызовет
      // setSlides + go(0); мы дальше ничего не делаем.
      if (typeof this.options.onPrev === 'function' && this.options.onPrev() === true) return;
      index = 0;
    }
    if (index >= this.segments.length) {
      // Выход за правую границу — следующий автор. Если страницы нет / нечего
      // показать — закрываемся (досмотр последнего сегмента последнего автора).
      if (typeof this.options.onNext === 'function' && this.options.onNext() === true) return;
      this._finish();
      return;
    }
    this.current = index;

    // Обновляем сегменты прогресс-бара
    this.segments.forEach(function (seg, i) {
      seg.classList.remove('__state-done', '__state-active');
      // Перезапустить CSS-анимацию: убрать и навесить класс заново
      // (см. https://css-tricks.com/restart-css-animation/)
      void seg.offsetWidth; // force reflow
      if (i < index) seg.classList.add('__state-done');
      else if (i === index) seg.classList.add('__state-active');
    });

    // Опц.: подменить контент слайда, если передали массив
    if (this.slides && this.slides[index]) {
      var s = this.slides[index];
      var media = this.root.querySelector('.moment__media');
      if (media) {
        if (s.src) {
          media.src = s.src;
          media.style.display = '';
        } else if (s.color) {
          // Сториз без картинки — просто цветная заливка карточки
          media.removeAttribute('src');
          media.style.display = 'none';
        }
      }
      if (s.color) this.root.style.backgroundColor = s.color;
      var title = this.root.querySelector('.moment__header-title');
      if (title && s.title != null) title.textContent = s.title;
      var sub = this.root.querySelector('.moment__header-subtitle');
      if (sub && s.subtitle != null) sub.textContent = s.subtitle;
      var avaImg = this.root.querySelector('.moment__header .avatar img');
      if (avaImg && s.avatar) avaImg.src = s.avatar;

      // BDAY — именинный шаблон: фото-фон + блюр снизу + три строки текста.
      // Слайд с `s.bday = { kicker, heading, name }` включает .__view-bday
      // и рендерит блок .moment__bday. Header остаётся видимым.
      var bdayHost = this.root.querySelector('.moment__bday');
      if (s.bday) {
        if (!bdayHost) {
          bdayHost = document.createElement('div');
          bdayHost.className = 'moment__bday';
          // Кладём перед .moment__cta, чтобы CTA остался поверх.
          var cta = this.root.querySelector('.moment__cta');
          if (cta) {
            cta.parentNode.insertBefore(bdayHost, cta);
          } else {
            this.root.appendChild(bdayHost);
          }
        }
        bdayHost.innerHTML =
          '<div class="moment__bday-blur"></div>' +
          '<div class="moment__bday-content">' +
            '<p class="moment__bday-kicker">' + (s.bday.kicker || 'Сегодня') + '</p>' +
            '<h2 class="moment__bday-heading">' + (s.bday.heading || 'День рождения') + '</h2>' +
            '<p class="moment__bday-name">' + (s.bday.name || '') + '</p>' +
          '</div>';
        this.root.classList.add('__view-bday');
      } else if (bdayHost) {
        bdayHost.remove();
        this.root.classList.remove('__view-bday');
      }

      // BODY — произвольный контент поверх media (ВВЗ-сториз, например).
      // slide.body — HTML-строка или DOM-узел. Если задан, заменяем содержимое
      // .moment__body и показываем слот; иначе слот скрыт.
      // Также включаем .moment.__view-body — в этом режиме скрываются
      // аватарка и текст автора в header'е (остаётся только прогресс + ✕).
      var body = this.root.querySelector('.moment__body');
      if (body) {
        if (s.body) {
          body.style.display = '';
          if (typeof s.body === 'string') {
            body.innerHTML = s.body;
          } else {
            body.innerHTML = '';
            body.appendChild(s.body);
          }
          this.root.classList.add('__view-body');
        } else {
          body.style.display = 'none';
          body.innerHTML = '';
          this.root.classList.remove('__view-body');
        }
      }

      // CTA — кнопка снизу. Если slide.cta = {label, onClick} — рендерим,
      // иначе скрываем слот. Кликовый обработчик навешиваем напрямую
      // (один раз на сегмент).
      var cta = this.root.querySelector('.moment__cta');
      if (cta) {
        if (s.cta && s.cta.label) {
          cta.style.display = '';
          cta.innerHTML =
            '<div class="button-wrapper __size-44 __style-secondary-on-color">' +
              '<button class="button-container __style-secondary-on-color" type="button">' +
                '<span class="button-content"></span>' +
              '</button>' +
            '</div>';
          cta.querySelector('.button-content').textContent = s.cta.label;
          if (typeof s.cta.onClick === 'function') {
            cta.querySelector('button').addEventListener('click', s.cta.onClick);
          }
        } else {
          cta.style.display = 'none';
          cta.innerHTML = '';
        }
      }
    }

    if (typeof this.options.onChange === 'function') {
      this.options.onChange(index);
    }
  };

  MomentViewer.prototype._onPrev = function () { this.go(this.current - 1); };
  MomentViewer.prototype._onNext = function () { this.go(this.current + 1); };

  MomentViewer.prototype._onAnimEnd = function (e) {
    if (!e.target.classList || !e.target.classList.contains('moment__progress-segment')) return;
    if (!e.target.classList.contains('__state-active')) return;
    this.go(this.current + 1);
  };

  MomentViewer.prototype._onKey = function (e) {
    if (e.key === 'ArrowLeft')  { this._onPrev(); }
    if (e.key === 'ArrowRight') { this._onNext(); }
    if (e.key === 'Escape')     { this._finish(); }
  };

  MomentViewer.prototype.pause  = function () { this.root.classList.add('__state-paused'); };
  MomentViewer.prototype.resume = function () { this.root.classList.remove('__state-paused'); };

  // Подменить сториз нового автора: пересобрать сегменты прогресса и слайды.
  // Страница вызывает это из onNext/onPrev перед тем как вернуть true.
  MomentViewer.prototype.setSlides = function (slides) {
    this.slides = slides || [];
    var bar = this.root.querySelector('.moment__progress');
    if (bar) {
      bar.innerHTML = '';
      for (var i = 0; i < this.slides.length; i++) {
        var seg = document.createElement('div');
        seg.className = 'moment__progress-segment';
        bar.appendChild(seg);
      }
      this.segments = Array.prototype.slice.call(bar.children);
    }
    this.current = 0;
  };

  MomentViewer.prototype._finish = function () {
    // Залить все сегменты «done», убрать активный
    this.segments.forEach(function (seg) {
      seg.classList.remove('__state-active');
      seg.classList.add('__state-done');
    });
    this.root.dispatchEvent(new CustomEvent('moment:viewed', { bubbles: true }));
    if (typeof this.options.onClose === 'function') this.options.onClose();
  };

  MomentViewer.prototype.destroy = function () {
    document.removeEventListener('keydown', this._onKey);
    this.root.removeEventListener('animationend', this._onAnimEnd);
    if (this._prev) this._prev.removeEventListener('click', this._onPrev);
    if (this._next) this._next.removeEventListener('click', this._onNext);
  };

  // ============================================================
  // BIND-ROW — связка карусели аватарок (.stories-row) с viewer'ом
  //
  //   MomentViewer.bindRow(rowEl, viewerEl, {
  //     slides: function (avatarEl) { return [{ color, src, cta, ... }, …]; },
  //     // Не обязателен. Если не передан — по data-stories на аватарке
  //     // и data-cta-label делается базовый набор пустых сегментов.
  //   });
  //
  // Из data-атрибутов аватарки берётся:
  //   data-stories     — количество сегментов прогресса (default 1)
  //   data-name        — заголовок в шапке viewer'а
  //   data-cta-label   — лейбл CTA-кнопки снизу (если есть)
  //   data-skip-viewer — аватарка не открывает viewer
  //
  // Сам viewer должен содержать:
  //   .moment__progress, .moment__header-title, .moment__header .avatar img,
  //   .moment__cta (опц.), [aria-label="Закрыть"] (опц., для тапа на крестик).
  // ============================================================
  function bindRow(rowEl, viewerEl, options) {
    options = options || {};
    var currentAva = null;
    var instance = null;

    function avatars() {
      return Array.prototype.filter.call(
        rowEl.querySelectorAll('.avatar'),
        function (a) { return !a.hasAttribute('data-skip-viewer'); }
      );
    }

    function defaultSlides(ava) {
      var count = parseInt(ava.getAttribute('data-stories'), 10) || 1;
      var ctaLabel = ava.getAttribute('data-cta-label');
      var palette = options.palette || DEFAULT_PALETTE;
      var list = [];
      for (var i = 0; i < count; i++) {
        var s = { color: palette[i % palette.length] };
        if (ctaLabel) s.cta = { label: ctaLabel };
        list.push(s);
      }
      return list;
    }

    function slidesFor(ava) {
      if (typeof options.slides === 'function') {
        var custom = options.slides(ava);
        if (custom) return custom;
      }
      return defaultSlides(ava);
    }

    function applyAuthor(ava) {
      currentAva = ava;
      var titleEl = viewerEl.querySelector('.moment__header-title');
      if (titleEl) titleEl.textContent = ava.getAttribute('data-name') || '';

      // Аватар в шапке viewer'а — копия аватарки из стака сториз.
      // Копируем тип (__type-image / __type-placeholder / __type-emoji / …)
      // и содержимое (img / emoji-символ), сохраняя свой __size-36.
      var headerAva = viewerEl.querySelector('.moment__header > .avatar');
      if (headerAva) {
        Array.prototype.slice.call(headerAva.classList).forEach(function (c) {
          if (/^__type-/.test(c)) headerAva.classList.remove(c);
        });
        Array.prototype.slice.call(ava.classList).forEach(function (c) {
          if (/^__type-/.test(c)) headerAva.classList.add(c);
        });
        headerAva.innerHTML = ava.innerHTML;
      }
    }

    function markViewed(ava) {
      if (!ava) return;
      ava.classList.remove('__ring-active');
      ava.classList.add('__ring-viewed');
    }

    // Шаг к соседней аватарке. dir = +1 | -1. true = переход выполнен.
    function step(dir) {
      var list = avatars();
      var i = list.indexOf(currentAva);
      var nextAva = list[i + dir];
      if (!nextAva) return false;
      if (dir > 0) markViewed(currentAva);
      applyAuthor(nextAva);
      instance.setSlides(slidesFor(nextAva));
      instance.go(0);
      return true;
    }

    function open(ava) {
      applyAuthor(ava);
      viewerEl.hidden = false;

      if (instance) instance.destroy();
      instance = new MomentViewer(viewerEl, {
        slides: slidesFor(ava),
        onNext: function () { return step(+1); },
        onPrev: function () { return step(-1); },
        onClose: function () {
          viewerEl.hidden = true;
          markViewed(currentAva);
        }
      });
    }

    rowEl.addEventListener('click', function (e) {
      var ava = e.target.closest('.avatar');
      if (!ava || !rowEl.contains(ava)) return;
      if (ava.hasAttribute('data-skip-viewer')) return;
      open(ava);
    });

    var closeBtn = viewerEl.querySelector('[aria-label="Закрыть"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (instance) instance._finish();
      });
    }
  }

  // ============================================================
  // CREATE — фабрика DOM-узла viewer'а с готовой разметкой.
  // На странице: document.getElementById('slot').replaceWith(MomentViewer.create()).
  // ============================================================
  function createViewer(opts) {
    opts = opts || {};
    var duration = opts.duration || '4s';
    var el = document.createElement('div');
    el.className = 'moment __fullscreen';
    el.hidden = true;
    el.style.cssText = '--moment-duration: ' + duration + '; z-index: 1000;';
    el.innerHTML = [
      '<div class="moment__statusbar">',
        '<span class="moment__statusbar-time">9:41</span>',
      '</div>',
      '<div class="moment__topbar">',
        '<div class="moment__progress"></div>',
        '<div class="moment__header">',
          '<div class="avatar __size-36 __type-image"><img src="" alt=""></div>',
          '<div class="moment__header-text">',
            '<div class="moment__header-title"></div>',
            '<div class="moment__header-subtitle">только что</div>',
          '</div>',
          '<span class="button-inline-wrapper __view-primary-on-color __size-24">',
            '<button class="button-inline __size-24" aria-label="Ещё">',
              '<span class="button-inline__content">',
                '<img class="button-inline__icon" src="assets/icons/more_24.svg" width="24" height="24" alt="" style="filter: brightness(0) invert(1);">',
              '</span>',
            '</button>',
          '</span>',
          '<span class="button-inline-wrapper __view-primary-on-color __size-24">',
            '<button class="button-inline __size-24" aria-label="Закрыть">',
              '<span class="button-inline__content">',
                '<img class="button-inline__icon" src="assets/icons/close_16_20.svg" width="24" height="24" alt="" style="filter: brightness(0) invert(1);">',
              '</span>',
            '</button>',
          '</span>',
        '</div>',
      '</div>',
      '<div class="moment__body" style="display: none;"></div>',
      '<div class="moment__nav">',
        '<button class="moment__nav-zone __side-prev" aria-label="Назад"></button>',
        '<button class="moment__nav-zone __side-next" aria-label="Дальше"></button>',
      '</div>',
      '<div class="moment__cta" style="display: none;"></div>',
      '<div class="moment__handle"></div>'
    ].join('');
    return el;
  }

  // Палитра по умолчанию для обычных сториз без картинки. Используется в
  // bindRow, если slides()-колбэк не передан или вернул null.
  var DEFAULT_PALETTE = ['#FF7700', '#5856D6', '#34C759', '#FF3B30', '#007AFF', '#AF52DE'];

  // ============================================================
  // VVZ-SLIDE — фабрика slide-объекта для viewer'а с ВВЗ-контентом.
  //   MomentViewer.vvzSlide({
  //     title:  'Возможно вы знакомы',
  //     people: [{ name, sub, img, mutuals?, m? }, …],
  //     cta:    { label: 'Показать всех', onClick? }   // опц.
  //   });
  // Карточки рендерятся через window.VvzCard.render — соответствующий модуль
  // должен быть подключён.
  // ============================================================
  function vvzSlide(opts) {
    opts = opts || {};
    var people = opts.people || [];
    var renderCard = (window.VvzCard && window.VvzCard.render) || function () { return ''; };
    var cards = people.map(renderCard).join('');
    var body = [
      '<h2 class="moment__body-title ds-title-xl">' + (opts.title || '') + '</h2>',
      '<div class="moment__body-grid">' + cards + '</div>'
    ].join('');
    var slide = { color: opts.color || '#2E2F33', body: body };
    if (opts.cta) slide.cta = opts.cta;
    return slide;
  }

  // ============================================================
  // BDAY-SLIDE — фабрика slide-объекта именинного шаблона.
  //   MomentViewer.bdaySlide({
  //     name:     'Лизы Михайловой',   // склонение в род. падеже под "День рождения …"
  //     photo:    'https://…',         // полноэкранный фон (фото именинника)
  //     kicker:   'Сегодня',           // мелкий приглушённый текст сверху  (опц.)
  //     heading:  'День рождения',     // большой заголовок                  (опц.)
  //     cta:      'Поздравить',        // лейбл CTA-кнопки                   (опц.)
  //     headerTitle:    'День рождения Лизы',  // переопределение title в header'е
  //     headerSubtitle: '3 часа назад',        // и subtitle (опц.)
  //   });
  // ============================================================
  function bdaySlide(opts) {
    opts = opts || {};
    var slide = {
      src: opts.photo,
      bday: {
        kicker:  opts.kicker  || 'Сегодня',
        heading: opts.heading || 'День рождения',
        name:    opts.name    || ''
      }
    };
    if (opts.headerTitle    != null) slide.title    = opts.headerTitle;
    if (opts.headerSubtitle != null) slide.subtitle = opts.headerSubtitle;
    if (opts.cta) slide.cta = { label: opts.cta };
    return slide;
  }

  // Экспорт
  window.MomentViewer = {
    init:      function (root, options) { return new MomentViewer(root, options); },
    bindRow:   bindRow,
    create:    createViewer,
    vvzSlide:  vvzSlide,
    bdaySlide: bdaySlide,
    palette:   DEFAULT_PALETTE
  };
})();

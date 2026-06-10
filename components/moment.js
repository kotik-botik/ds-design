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
    this.segments = Array.prototype.slice.call(
      root.querySelectorAll('.moment__progress-segment')
    );
    this.slides = this.options.slides || null; // [{src, title, subtitle, avatar}]
    this.current = 0;

    this._onPrev = this._onPrev.bind(this);
    this._onNext = this._onNext.bind(this);
    this._onAnimEnd = this._onAnimEnd.bind(this);
    this._onKey = this._onKey.bind(this);

    var prev = root.querySelector('.moment__nav-zone.__side-prev');
    var next = root.querySelector('.moment__nav-zone.__side-next');
    if (prev) prev.addEventListener('click', this._onPrev);
    if (next) next.addEventListener('click', this._onNext);

    // Завершение анимации активного сегмента → автоматический next
    root.addEventListener('animationend', this._onAnimEnd);

    document.addEventListener('keydown', this._onKey);

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
  };

  // Экспорт
  window.MomentViewer = {
    init: function (root, options) { return new MomentViewer(root, options); }
  };
})();

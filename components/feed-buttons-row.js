/**
 * OK Design System — FeedButtonsRow behaviour
 *
 * Делегированный click-обработчик: тап по любому .button-container,
 * внутри которого лежит .icon.__view-klass, переключает класс
 * .__view-liked на самой кнопке. icon.css в свою очередь свапает
 * иконку klass_*.svg на klass_filled_*.svg.
 *
 * Только переключение состояния — никаких цветовых эффектов, фокусов
 * или анимаций здесь не делается, они уже описаны в CSS.
 */
(function () {
  function onClick(e) {
    const btn = e.target.closest('.button-container');
    if (!btn) return;
    if (btn.disabled || btn.classList.contains('__state-disabled') || btn.classList.contains('__state-loading')) return;
    if (!btn.querySelector('.icon.__view-klass')) return;
    btn.classList.toggle('__view-liked');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.addEventListener('click', onClick));
  } else {
    document.addEventListener('click', onClick);
  }
})();

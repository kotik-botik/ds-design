---
name: new-screen
description: >-
  Создать новый экран-прототип на DS: каркас phone-frame + meshok-up (status-bar +
  nav-bar) + контент + tabbar, с подключённым системным переходом и навигацией.
  Используй, когда просят «новый экран», «создай страницу-прототип», «заскаффолди
  экран», «ещё один экран ленты/сообщений» и т.п.
---

# New Screen (scaffold)

Генерирует новый `<name>.html` — мобильный экран-прототип в едином стиле с messages/
notifications/tribune, чтобы не копипастить и не забыть обязательные подключения.

## Перед генерацией уточни (если не задано в запросе)
- **Имя файла** (`<name>.html`) и **заголовок** в навбаре.
- **Кнопка «назад»** в навбаре — нужна? (да → `.nav-bar__back`).
- **Активная вкладка** таббара (`feed | book | message | clip | menu`).
- Тип навбара (`__type-feed` по умолчанию; есть `__type-publish`, `__type-search`).

## Обязательные правила (иначе сломается)
- `screen-transition.js` подключать **в `<head>` синхронно** (pagereveal одноразовый,
  срабатывает до отрисовки — скрипт в конце body опаздывает).
- Корень экрана — `.phone-frame[data-screen]` (нужно для системного перехода).
- Шапка — DS `meshok-up`: `display:contents`, sticky только у `.status-bar`; фон
  `status-bar`/`nav-bar` зафиксирован в компоненте (не переопределять на странице).
- Кнопка назад — канон `.nav-bar__back` (поведение даёт screen-transition.js), иконка
  через слот `.icon __size-24 __slot-back` (а не `<img>`).
- Таббар-навигацию даёт `components/tab-bar.js` (подключить в конце body); маршруты —
  в ROUTES самого tab-bar.js (при необходимости добавить слот→страницу там).
- Высоты/паддинги/таббар — через токены `--space-*`; фон страницы `--dynamic-surface-base-*`.

## Каркас (адаптируй заголовок/назад/активную вкладку)

```html
<!DOCTYPE html>
<html lang="ru" class="__ui-theme_enabled __ui-theme_light __font-roboto">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>НАЗВАНИЕ — прототип</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600&display=swap">
<link rel="stylesheet" href="index.css">
<!-- В head синхронно: listener pagereveal должен зарегистрироваться до события -->
<script src="components/screen-transition.js"></script>
<style>
  * { -webkit-tap-highlight-color: transparent; }
  html, body { margin:0; padding:0; height:100%; background: var(--dynamic-surface-base-secondary); }
  .phone-frame { width:100%; max-width:none; height:100dvh; min-height:100dvh; overflow:hidden;
                 background: var(--dynamic-surface-base-secondary); }
  .phone-frame__feed { min-height:0; overflow-y:auto; -webkit-overflow-scrolling:touch; }
  .phone-frame__feed::-webkit-scrollbar { display:none; }
  .ll-icon { display:inline-block; flex-shrink:0; vertical-align:middle; }
  .ll-tabbar { position:fixed; left:0; right:0; bottom:0; z-index:50; }
</style>
</head>
<body>
  <div class="phone-frame" data-screen>
    <div class="phone-frame__feed">

      <div class="meshok-up">
        <div class="status-bar">
          <span class="status-bar__time">9:41</span>
          <span class="status-bar__indicators">
            <img class="ll-icon" src="assets/icons/status-wifi.svg"    width="16" height="12" alt="">
            <img class="ll-icon" src="assets/icons/status-signal.svg"  width="17" height="12" alt="">
            <img class="ll-icon" src="assets/icons/status-battery.svg" width="25" height="12" alt="">
          </span>
        </div>
        <div class="nav-bar __type-feed">
          <div class="nav-bar__leading">
            <!-- back (опционально): -->
            <span class="button-inline-wrapper __size-24 __view-secondary"><button class="button-inline __size-24 nav-bar__back" aria-label="Назад"><span class="button-inline__content"><span class="icon __size-24 __slot-back"></span></span></button></span>
            <span class="ds-title-l">НАЗВАНИЕ</span>
          </div>
          <div class="nav-bar__trailing">
            <!-- иконки-действия (button-inline __size-24, иконки из assets/icons) -->
          </div>
        </div>
      </div>

      <!-- КОНТЕНТ ЭКРАНА -->

    </div>

    <!-- TABBAR (активная вкладка — нужный __slot-* + __state-on) -->
    <div class="ll-tabbar">
      <div class="tabbar __platform-ios">
        <div class="tabbar__row">
          <button class="tabbar-icon __slot-feed" aria-label="Лента"></button>
          <button class="tabbar-icon __slot-book" aria-label="Книга"></button>
          <button class="tabbar-icon __slot-message" aria-label="Сообщения"></button>
          <button class="tabbar-icon __slot-clip" aria-label="Клипы"></button>
          <button class="tabbar-icon __slot-menu" aria-label="Меню"></button>
        </div>
        <div class="tabbar__handle"></div>
      </div>
    </div>
  </div>

  <script src="components/tab-bar.js"></script>
</body>
</html>
```

## После генерации
- Контент собирай из DS-компонентов (uni-cell/uni-card/media/avatar/button…), типографику — `.ds-*`.
- Если экран должен открываться из таббара/ссылки — добавь маршрут в `components/tab-bar.js` (ROUTES).
- Закоммить и задеплоить по правилам проекта (ветка → PR → squash-merge).
- При интерактиве/анимациях — прогони `/verify-ui` (агент screenshot-testing).

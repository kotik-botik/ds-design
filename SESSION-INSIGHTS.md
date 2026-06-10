# Session Insights — ds-design

Технические инсайты по работе с компонентами DS и прототипами, собранные за сессию.
Практические заметки «как делать правильно» + грабли, на которые наступили.

---

## 1. Компоненты DS: как использовать

### uniCard (`components/uni-card.css`)
- Вертикальная карточка: `wrapper(__size-160|220|320|custom) → card(__has-background __state-enabled) → media + content`.
- `__has-background` даёт заливку/бордер/паддинги контента; без него — прозрачно, контент flush.
- Press-фидбэк уже встроен: `:active/.__clicked → scale(0.98)`.

### uniCell (`components/uni-cell.css`)
- Универсальная строка списка: `wrapper → container(__state-enabled) → cell` (flex-row).
- Слоты: `avatar` (leading) + `uni-cell-additional-content` (flex-column, центр) + правый элемент.
- База `.uni-cell` БЕЗ gap — gap задаётся типом (`__type-activity`) или локально.

### media (`components/media.css`)
- `.media.__aspect-1-1|4-3|16-9|9-16`, img `object-fit:cover`.
- Есть оверлеи: `__type-video/gallery/clip`, `media__play/time/mute/tag`.
- ⚠️ Нет «media с backgroundBlur-подложкой» и «on-image close» как готового варианта — пришлось делать кастомный компонент (см. friend-card).

### header (`components/header.css`)
- `<header class="header __size-xl|l|m|s"><div class="header__title">…</div><div class="header__subtitle">…</div></header>`.
- Пары типографики: `m` → **title-m (17px)** + body-m. Для секционных заголовков уровня «17/title m» — это `__size-m`.

### button-inline (`components/button-inline.css`)
- Текстовая инлайн-кнопка. Размеры 16/20/24/32, view primary/secondary/tertiary.
- ⚠️ **Иконочная button-inline в навбаре «прыгает»**: база `display:inline-block`, внутри `inline-flex`-контент с `<img>` → baseline-зазор, иконка сидит неровно. Фикс (скоуп `.nav-bar`):
  ```css
  .nav-bar .button-inline { display:flex; align-items:center; justify-content:center; height:100%; }
  ```

### button-circle (`components/button-circle.css`)
- Круглая кнопка, размеры 16/20/24/36/44/56. Иконка через `.icon.__src` (mask + currentColor).
- Подходит для FAB: `button-circle-wrapper __size-56 __style-primary`, позицию (fixed) задаёт обёртка снаружи.

### avatar (`components/avatar.css`)
- Размеры: 16/20/24/36/44/56/72/96/120/144 — **48 НЕТ** (берём 44 или 56).
- Кольца историй: `__ring-active` (оранж) / `__ring-viewed` (серое); outline не занимает место → орбиту выносим через `margin`.
- Добавлен общий press-бамп: `:active/.__clicked → scale(0.95)` (timing как у кнопок).

### meshok-up (`components/meshok-up.css`)
- Sticky-шапка: `status-bar + nav-bar + tabs`, скругление снизу 20px.
- Дефолтный фон у `.meshok-up`/`.status-bar`/`.nav-bar` — `--dynamic-surface-base-secondary` (белый).
- Прозрачную шапку нельзя сделать только на контейнере: дети (`status-bar`/`nav-bar`) красят свой фон и перекрывают → прозрачность ставим и им.
- Чтобы цвет фона нельзя было переопределить на странице — фиксируем `!important` (DS-варианты вроде `nav-bar.__type-publish` тоже с `!important`, чтобы не проигрывать базе).

### tabbar (`components/tabbar.css` + `components/tab-bar.js`)
- Навигация вынесена в компонентный скрипт: карта `__slot-* → страница` + приоритет `data-href`; активная вкладка `__state-on` не реагирует.
- Свайп вверх по `.tabbar__handle` (> 40px) → `start.html` (имитация home-indicator).

---

## 2. Кастомные компоненты (когда DS не покрывает)

- **friend-card** (`components/friend-card.css`) — карточка «Возможные друзья» в ленте: full-bleed квадратное фото + blur-подложка + крестик поверх фото.
- **vvz-card** (`components/vvz-card.css`) — карточка «Возможно, вы знакомы» в сообщениях: круглый аватар по центру + «×» в углу + текст по центру.
- **message-cell** (`components/message-cell.css`) — строка диалога на базе uni-cell.

📌 **Инсайт:** одинаковая по смыслу сущность (ВВЗ) может требовать ДВУХ разных компонентов, если лейаут в макетах отличается. Важно не делать их «одним общим» — держим раздельно (`friend-card` ≠ `vvz-card`).

📌 Кастомный компонент всё равно стоит на DS-примитивах (`.button`, `.avatar`), а типографику вешаем классами `.ds-*` в разметке.

---

## 3. Текст и усечение (ellipsis)

- `text-overflow:ellipsis` срабатывает только на блочном/inline-block элементе с `overflow:hidden; white-space:nowrap`. **На `inline-flex` к тексту НЕ применяется** → текст надо обернуть в отдельный `__text`-спан, который и усекаем.
- Чтобы метаданные (время) **липли к тексту**, а не уезжали к краю: превью `flex: 0 1 auto` (не `1 1 auto`). При `1 1` превью растягивается и толкает время вправо.
- Не вставляем «…» руками — пусть многоточие появляется само при достижении края.

---

## 4. Системный переход между экранами (View Transitions)

`components/screen-transition.css` + `.js`.

- Кросс-документный переход: `@view-transition { navigation: auto; }` (в `index.css`, значит у всех страниц с ним).
- ⚠️ **Самописная transform-анимация `.phone-frame` даёт рывок** — особенно при возврате на bfcache-страницу: кадр в исходной позиции → скачок в офсет. Нативный VT этого лишён.
- Направление (push/pop) делаем через класс **`html.nav-back`**, а НЕ через `viewTransition.types` — types в кросс-документном переходе ненадёжно доезжают до входящего документа.
- ⚠️ **Тайминг — главный грабли:** `pagereveal` одноразовый и фаерится очень рано (~84мс, до первой отрисовки). Listener надо вешать синхронным `<script src>` **в `<head>`**. Скрипт в конце `<body>` (и `defer`) опаздывает → класс не ставится → back играет forward.
- Направление определяем: флаг в `sessionStorage` (ставит клик по `.nav-bar__back`) + фолбэк через Navigation API (`activation.navigationType === 'traverse'`, сравнение `from.index`/`entry.index`).
- z-index: при pop уезжающий старый экран должен быть ПОВЕРХ (`html.nav-back ::view-transition-old(root){ z-index:2 }`).
- Уважаем `prefers-reduced-motion`.

---

## 5. Единый компонент «Назад»

- Канон: `.nav-bar__back` = `button-inline __size-24` + иконка `back_24.svg`. Поведение и анимацию даёт `screen-transition.js` (`history.back()` по умолчанию, опц. `data-href`).
- На странице ничего не прокидываем — достаточно класса `.nav-bar__back` в навбаре + `screen-transition.js` в `<head>`.
- Используется одинаково в `messages.html`, `tribune.html`, `notifications.html`.

---

## 6. Анимации скрытия (vvz-card)

- Контейнер `[data-vvz]`, крестик карточки `[data-vvz-hide]`, «Скрыть» `[data-vvz-hide-all]` (логика в `components/vvz-card.js`).
- Затухание `ease-in-out 500ms` (opacity + лёгкий scale). Удалили последнюю карточку → схлопываем весь контейнер.
- **Плавное «подъезжание» нижних ячеек:** фиксируем `height` контейнера в px, затем в `requestAnimationFrame` анимируем `height/padding/margin → 0`. Просто `display:none`/`remove()` даёт скачок.

---

## 7. Иконки

- DS-иконки в `assets/icons/` — залитые `fill="black"`, viewBox 24. Как `<img>` **не наследуют currentColor** (для перекраски — CSS-фильтр `brightness(0) invert(1)` для белого).
- Шеврон ≠ стрелка: в макетах рядом с тайтлом — тонкий **chevron** («⌄», без стебля), а не `arrow_down` (со стеблем). Завели `chevron_down_24.svg`.
- Звонок в макете — **контурный** (outline), а не залитый: завели `call_24.svg` (stroke).
- Навбар держим целиком на ассетных иконках (без инлайновых SVG).

---

## 8. Lottie

- Анимация «Класс!» по тапу на лайк: `lottie-web` (CDN) + оверлей `assets/lottie/like.json`, проигрывается при постановке лайка (checkbox checked), удаляется по `complete`.
- **Центрирование оверлея** — по видимой `.button-container` (а не по `<label>`, который шире из-за иконки+счётчика) + `transform: translate(-50%,-50%)`.

---

## 9. Токены (важные значения, светлая тема)

| Токен | Значение |
|---|---|
| `--dynamic-surface-base-secondary` | белый (#fff) — фон карточек/шапки |
| `--dynamic-surface-base-tertiary` | `#F7F4F2` — фон карточек ВВЗ |
| `--dynamic-text-and-icons-base-primary` | основной текст |
| `--dynamic-text-and-icons-base-secondary` | `rgba(46,47,51,0.88)` — текст превью |
| `--dynamic-text-and-icons-base-tertiary` | `rgba(46,47,51,0.64)` — время/приглушённое |

- Типографика — классами `.ds-title-* / .ds-body-* / .ds-caption-*`.
- Стандартный timing интерактива: `transform 500ms cubic-bezier(0, -0.3, 0.5, 1.3)`, press = `scale(0.95)` (кнопки/аватар) / `scale(0.98)` (карточки).

---

## 10. Окружение и процесс (техничка)

- `figma.com` закрыт network-allowlist окружения → `curl`/`WebFetch` к ассетам Figma не работают (403 / Host not in allowlist). MCP отдаёт **ссылку/превью, а не байты**.
- Картинка, **вставленная в чат текстом**, на диск не сохраняется (байтов нет). Нужно прикладывать **файлом-вложением** — тогда попадает в `assets/icons/` (так доехали `splashLogo.png`, `bannerBack1.png`).
- Иногда файлы приезжают в корень репо — переносим в `assets/icons/`.
- Параллельные правки/переименования в репозитории случаются (напр. `lenta-light.html` → `lenta-q3.html`); при слиянии используем `merge -X ours` и проверяем, что ссылки (`tab-bar.js` ROUTES, навигация) согласованы и нет битых путей.
- Интерактив/анимации/последовательности переходов проверяем реальным прогоном в браузере (Playwright/Chromium-агент): измеряем computed styles, `getAnimations()`, `sessionStorage`, снимаем кадры середины перехода — юнит-тест это не ловит.

---

## Карта живых экранов (GitHub Pages)

- `start.html` — лаунчер: локскрин → меню → сплеш ОК → лента.
- `lenta-q3.html` — основная лента (бывший `lenta-light.html`).
- `messages.html` — сообщения. `notifications.html` — уведомления. `tribune.html` — трибуна.
- `lenta.html` — десктоп-превью собранной ленты. `preview.html` — витрина примитивов/молекул.

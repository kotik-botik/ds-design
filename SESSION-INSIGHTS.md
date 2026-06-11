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
- Шапка: `status-bar + nav-bar + tabs`. Сам `.meshok-up` — `display: contents` (свой box убран), чтобы дети попали в поток scroll-контейнера страницы.
- **Sticky только у `.status-bar`** (`position:sticky; top:0`) — он всегда виден; `nav-bar` и `tabs` уезжают вверх со скроллом. Высота статус-бара опубликована на `:root` как `--status-bar-height` (44px), чтобы оверлеи (heads-up уведомления и пр.) отстраивались от неё.
- Фон `.status-bar`/`.nav-bar` — `--dynamic-surface-base-secondary`, **зафиксирован `!important`** (на странице переопределять нельзя). DS-вариант `nav-bar.__type-publish` — `transparent !important`, чтобы не проигрывать базе.
- 📌 Инсайт: прозрачность шапки нельзя ставить только на контейнер — дети красят свой фон; и если цвет должен быть «железным», фиксируй `!important`, а исключения делай тоже `!important`-вариантами (а не ad-hoc на странице).

### tabbar (`components/tabbar.css` + `components/tab-bar.js`)
- Навигация вынесена в компонентный скрипт: карта `__slot-* → страница` + приоритет `data-href`; активная вкладка `__state-on` не реагирует.
- Свайп вверх по `.tabbar__handle` (> 40px) → `start.html` (имитация home-indicator).
- ⚠️ Любая новая страница с таббаром должна **подключить `tab-bar.js`** — иначе иконки «мёртвые» (наступили: в `notifications.html` забыли скрипт → переходы не работали). `preview.html` намеренно БЕЗ него (витрина, глобальный клик перехватывал бы демо-таббары).

### Tab / TabsView (`components/tab.css` + `components/tab.js`)
- Порт DS Tab+TabsView на чистый CSS. Структура: `tabs-view(__with-divider) → tabs-row(__scroll) → tab-wrapper(__view-base|primary|secondary|custom)` → `inner-wrapper > tab > content > (left-icon/label/counter-inline/right-icon)` + `.line`.
- ⚠️ Класс `.tabs` уже занят секционным свитчером (`tabs.css`) → контейнер ряда назвали **`.tabs-row`**.
- **«Разъезжание» линии — чистый CSS:** `.line { transform: scaleX(0) }` → `__selected .line { scaleX(1) }` с пружинным easing (`cubic-bezier(0.34,1.4,0.64,1)`). JS (`tab.js`) только переключает `__selected`/`aria-selected`. На первой отрисовке уже выбранный таб показывает линию мгновенно (CSS-переход не играет «с нуля» на старте) — это и есть `shouldShowLineImmediately` из React-оригинала.
- Лейбл и каунтер — стиль **`ds-title-s`** (15/20, вес 600). Каунтер base — инлайн (`.counter-inline`, приглушённый).
- ⚠️ **button-reset обязан включать `padding: 0`** — иначе у `<button>` остаётся нативная гор. отбивка (~6px). У base-таба `--tab-horizontal-padding: 0`, расстояние задаёт `gap` ряда.
- `tab.js` авто-инициализирует все `.tabs-row`. Фильтрацию списка вешаем ОТДЕЛЬНЫМ скриптом по `data-filter`↔`data-cat` (оба слушателя на клике уживаются).

---

## 2. Кастомные компоненты (когда DS не покрывает)

- **friend-card** (`components/friend-card.css`) — карточка «Возможные друзья» в ленте: full-bleed квадратное фото + blur-подложка + крестик поверх фото.
- **vvz-card** (`components/vvz-card.css`) — карточка «Возможно, вы знакомы» в сообщениях: круглый аватар по центру + «×» в углу + текст по центру.
- **message-cell** (`components/message-cell.css`) — строка диалога на базе uni-cell.
- **notification-cell** (`components/notification-cell.css`) — строка оповещения: аватар + `__body`(`__title`/`__time`/`__mutuals`/`__actions`). Плоская, без подложки.
  - Внутренние вертикальные гэпы **по Figma** (`2260:98300`): заголовок→время **2px**, время→общие друзья **4px**, →кнопки **8px**, аватар↔контент **12px** (cell-view-gap). «between button cells» в макетах = `--dynamic-cell-view-vertical-default` (12px).
  - 📌 Сначала держали стили ячейки инлайном в странице — вынесли в компонент при чистке архитектуры (`notifications.html`: в `<style>` осталось только страничное — `phone-frame`, паддинги табов/списка, таббар).

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

- Канон: `.nav-bar__back` = `button-inline __size-24` + иконка-слот `.icon __size-24 __slot-back` (DS mask-иконка, перекрашивается через currentColor). Поведение и анимацию даёт `screen-transition.js` (`history.back()` по умолчанию, опц. `data-href`).
- На странице ничего не прокидываем — достаточно класса `.nav-bar__back` в навбаре + `screen-transition.js` в `<head>`.
- Используется одинаково в `messages.html`, `tribune.html`, `notifications.html`.

---

## 6. Скрытие строки карточек — компонент `dismissible`

Закрытие/схлопывание вынесено в **общий** компонент `components/dismissible.{css,js}`
(используется и в VVZ-блоке сообщений, и в friend-card-блоке ленты — не дублируем логику):

- `data-dismiss-row` — контейнер-строка; `data-dismiss-target` — карточка;
  `data-dismiss` — закрыть ближайшую карточку; `data-dismiss="row"` — закрыть всю строку.
- Закрыли последнюю карточку → строка тоже схлопывается.
- Затухание `ease-in-out 500ms` (opacity + лёгкий scale).
- **Плавное «подъезжание» нижних ячеек:** фиксируем `height` контейнера в px, затем в
  `requestAnimationFrame` анимируем `height/padding/margin → 0`. Просто `display:none`/`remove()` даёт скачок.

📌 Инсайт: одинаковое поведение в двух местах (лента + сообщения) → выносим в один
behaviour-компонент с `data-*`-хуками, а не копируем скрипт по страницам.

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

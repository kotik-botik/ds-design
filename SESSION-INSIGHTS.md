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

---

## 11. Sticky-меш и почему `display: contents` (углублённо)

Базовая раскладка: `.phone-frame__feed` — скролл-контейнер с `overflow-y: auto`, внутри `.meshok-up` (status-bar + nav-bar [+ tabs]). Хочется, чтобы при скролле прилеплялся **только status-bar**, а nav-bar/tabs уезжали вверх вместе с лентой.

📌 Если повесить `position: sticky; top: 0` напрямую на `.status-bar` **внутри обычного `.meshok-up` (block/flex)** — sticky отпускает status-bar, как только meshok-up уезжает выше топа. Причина: containing block для sticky — это родитель, и sticky **не может выходить за его bounds**. meshok-up короткий (~100px), скролл больше — status-bar едет вместе с ним.

✅ Решение — **`.meshok-up { display: contents }`**: убираем собственный box обёртки, дети попадают напрямую в поток `.phone-frame__feed`. Containing block для status-bar становится сам скролл-контейнер → sticky пинов на весь скролл.

Грабли при display:contents:
- Дети теперь прямые **flex-child** `.phone-frame__feed` (`display: flex; flex-direction: column`). По дефолту `flex-shrink: 1` → status-bar/nav-bar **сжимаются** (status-bar c заявленных 44 до ~31px). Лечится: `flex-shrink: 0` на обоих.
- Любая стилистика на самом `.meshok-up` (фон, border-radius) перестаёт применяться — box-а нет. Цвета держим **на детях** (status-bar/nav-bar background-color, см. секцию 1.meshok-up — фиксируется `!important`).

---

## 12. Перекрытие status-bar системными нотификациями (perception 31px)

История: дизайнер видела «статус-бар 31, а не 44». В DevTools `.status-bar { height: 44px }` стоял корректно. Реальная высота — 44px. **Видимая** — ~31px. Разница 13px — это перекрытие сверху другим элементом.

Виновник: `components/system-notifications.css` → `.notifs { position: fixed; top: 36px }`. Heads-up плашка стартовала на y=36 → накрывала нижние 8px status-bar'а. Дизайнер мерила «свободную» зону статус-бара до края накрытия → получала 31.

✅ Корневой фикс — **завязать оверлей на высоту шапки**, а не на магическое число:
```css
:root { --status-bar-height: 44px; }                 /* в meshok-up.css */
.status-bar { height: var(--status-bar-height); }
.notifs.__mode-heads-up {
  top: calc(var(--status-bar-height) + var(--space-1));  /* 44 + 4 */
}
```
Сменится высота шапки — оверлей подхватит сам. Lock-screen в `start.html` сидит на своих оверрайдах (`.device .notifs { top: 254px }`, `.device.headsup-notifs .notifs { top: 36px }`) и через специфичность переигрывает дефолт — ничего не ломается.

📌 Инсайт: когда два компонента физически делят координаты на экране (sticky-шапка + fixed-оверлей), **источник правды о размерах должен быть один** (CSS-переменная на `:root`). Магические числа в разных файлах гарантированно расходятся при правках.

---

## 13. iOS home-indicator пилюля и swipe-to-dismiss

`.tabbar__handle` в DS изначально был пустым 24px блоком — никакого визуального индикатора. Добавили на стороне платформы:

```css
.tabbar.__platform-ios .tabbar__handle::after {
  content: '';
  position: absolute;
  left: 50%; bottom: 8px;
  transform: translateX(-50%);
  width: 134px; height: 5px;
  border-radius: 100px;
  background: var(--dynamic-text-and-icons-base-primary);
}
```
Размер 134×5 — iOS spec. Цвет — base-primary (тёмный на светлой теме). Скоупим на `.__platform-ios`, для Android пилюли нет.

Свайп-вверх — в `tab-bar.js`: pointer-листенер на самом `.tabbar__handle`, threshold > 40px → `location.href = 'start.html'`. Жест работает на любой app-странице, потому что `tab-bar.js` подключён везде.

📌 Инсайт: визуальный home-indicator и его жест — **один компонент**. Не клади жест на отдельный `home-gesture.js`, который потом нужно вспомнить везде подключить.

---

## 14. Force-push на main посреди сессии

Ситуация: пока работали в feature-ветке, кто-то форс-пушнул main с откатом ряда наших коммитов (`meshok-up.css` вернул `!important` фоны, `tab-bar.js` вернул `lenta-light.html` и добавил `book: tribune.html`). PR на squash-мердж не пройдёт — «merge conflicts».

✅ Алгоритм:
1. `git fetch origin main` → видим `+ ... (forced update)`.
2. `git merge origin/main` (не rebase — много коммитов, тяжело резолвить по одному).
3. Резолвим конфликты руками; обычно один-два файла. Не паниковать на множестве `<<<<<<<` — `--stat` покажет, что conflicted только нужные.
4. После коммита-мерджа в ветку — `mcp__github__merge_pull_request` уже отрабатывает.
5. Проверить, что наши изменения переехали поверх ревёрнутого main, а не наоборот (например, `--status-bar-height` должен присутствовать).

📌 Инсайт: при долгих сессиях `git fetch origin main` перед каждым новым коммитом — дёшево, экономит большой резолв в конце.

---

## 15. Окружение: MCP-серверы переподключаются

`mcp__github__*` и `mcp__Figma__*` инструменты исчезают/появляются по ходу сессии (system-reminder уведомляет). Если ToolSearch говорит «нет такого» — подождать reconnect-нотификацию или один раз перепросить тулу через `select:<name>`. Не делать вывод «функционал недоступен» только из одного промаха ToolSearch.


# MEMORY — screenshot-testing для ds-design

Накопленные находки по тому, как этот прототип на самом деле себя ведёт в браузере. Дополняй после каждого прогона; устаревшее — удаляй или коротко обобщай.

## add-friends-sheet.html — автоплей кучка→разлёт→ряд (verified 2026-06-12, 390×844, commit 7639de1)
- Root = `#fp` (`.fp`). Состояния = классы на нём: `__state-1` (кучка), `__state-2` (разлёт), `__state-4`+`__cards-revealed` (ряд). После инверсии в 7639de1: STATES[0]=кучка (title 210), STATES[1]=разлёт (title 96) — порядок подтверждён в браузере, не только в коде.
- Элементы: 3 `.friend-big-card[data-i=1..3]` (300×460 base) + 4 `.fp-decor[data-decor=A..D]` (декор-кружки). Центры замеряй через getBoundingClientRect (cx=left+w/2).
- Тайминг сценария: `setTimeout 1000ms` держит state-1 (кучка читается) → spring 1→2 **2000ms** (k96 c6 m1) → PAUSE_BETWEEN 800ms → ease 2→3 300ms → spring 3→4 600ms. `__state-2` КЛАСС добавляется в НАЧАЛЕ спринга 1→2 (transitionTo(1) ставит `__state-`+2), позиции мид-флайт. Сэмплить state-2 надо после ~400-500ms осадки, но ДО PAUSE+2→3.
- Замеры (390×844, pravatar застаблен 1×1 PNG):
  - state-1 кучка: 7 центров СБИТЫ — spreadX 44, spreadY 26, x∈[185,229] y∈[442,468]. title.top=210 (offsetTop=210). w крупного кружка ~145.
  - state-2 разлёт: spreadX 251, spreadY 265, x∈[96,347] y∈[319,585]. Крупный (card i=2) ⌀~249 cx301/cy319 правый-верх. title styleTop едет к 96 (на сэмпле застал 99.6 — spring ещё садился; финальный таргет STATES[1].title=96).
  - ряд `__state-4`/`__cards-revealed`: 3 карточки w=300 в ряд (cx 181/493/805, cy441), все 4 `.fp-decor` **opacity 0**. title.top=96 ровно.
- title.textContent = «У вас7 новых друзей» (без пробела — `<br>` между «У вас» и «7», textContent склеивает; в DOM `У вас<br>7 новых друзей`).
- pravatar.cc даёт CERT-ошибку как везде — стаб `ctx.route('https://i.pravatar.cc/**', fulfill PNG)` обязателен иначе битые фото.

## vvz-portlet header + button-inline (verified 2026-06-12, 360×800)
- Header markup унифицирован: `<header class="vvz-portlet__header">` содержит `.vvz-portlet__title.ds-title-l` (текст «Возможно, вы знакомы», С ЗАПЯТОЙ — кодпоинт 44 после «Возможно») + правую кнопку. `aria-label` секции тоже «Возможно, вы знакомы» с запятой на всех 5 страницах (lenta-q3 / friends / guests / profile / messages). Запятая видна и в outerHTML, и в .textContent — раньше принял за отсутствующую, сверяй через charCodeAt.
- Messages — единственный, у кого внутри `.vvz-portlet__header` ещё вложен `<header class="header __size-m">` с `.header__title` — двойная вложенность header'ов. Title text всё равно тот же.
- Правый слот: `<span class="button-inline-wrapper __size-24 __view-primary">` (или `__view-secondary` на messages) → внутри `<button class="button-inline __size-24" data-href="vvz.html">` (или `data-dismiss="row"` на messages) → `<span class="button-inline__content">Ещё|Скрыть</span>`. **`data-href`/`data-dismiss` живут на ВНУТРЕННЕМ `<button>`, НЕ на wrapper-span.** Селекторами: `.vvz-portlet .button-inline[data-href="vvz.html"]` или `.button-inline[data-dismiss="row"]`. Тестировать тап по button (не span-wrapper) — `.click({force:true})` срабатывает, навигация на /vvz.html подтверждена.
- Цвет: primary = `rgb(215, 98, 0)` (#D76200, оранжевый), secondary = `rgb(0, 0, 0)`. Это computed color на wrapper-span (CSS-переменная пробрасывается на child).

## vvz-portlet компонент (2026-06-12, verified 360×800)
Унифицированный «Возможно, вы знакомы» поверх 5 экранов:
- Базовый класс: `.vvz-portlet` + опц. модификаторы `.island` (lenta-q3) / `.__messages` (messages, более компактный — h=274 vs 394).
- Шапка: `.vvz-portlet__header` (h=36–40, с тайтлом и кнопкой `.button-inline` «Ещё/Скрыть»).
- Скроллер: `.vvz-portlet__row` (display:flex, gap:8px, overflowX:auto). Модификатор `.__cards-160` → friend-card width=160/h=270 (вместо дефолта 220/330). Используется на lenta-q3 и profile.
- Дети: на friends/guests/lenta-q3/profile — `.friend-card`; на messages — `.vvz-card` (160×218, тот же, что в `vvz.html`-тиндере).
- Числа подтверждены: lenta-q3 (island+__cards-160) → friend-card 160px; friends → 220; guests → 220; messages (__messages) → vvz-card 160; profile (__cards-160) → 160.

## Грабли icon.css (2026-06-11, vvz.html)
- `<span class="icon __src" style="--icon-src: url('assets/icons/foo.svg')">` ломается: запрос уходит на `/components/assets/icons/foo.svg` → 404. Причина: `mask-image: var(--icon-src)` объявлено в `components/icon.css`, и CSS `url()` resolve'ится относительно файла-объявления, а не документа. Передача через CSS-переменную НЕ меняет точку resolve.
- Фиксы: либо `url('../assets/icons/...')` в инлайне (relative-to-icon.css), либо абсолютный путь `url('/assets/icons/...')`, либо использовать готовый `__slot-*` класс (там пути уже с `../`).
- Видно в DOM так: `getComputedStyle(span).maskImage === 'none'` потому что mask — на `::before`, а не на самом span. Чтобы проверить — смотри `.icon::before` или просто visual: круглые кнопки без глифов.

## vvz.html — «Найдите друзей» Tinder-карточки (2026-06-11)
- DOM-стэк: 3 `.vvz-card` рендерятся одновременно, последняя в DOM = TOP (z-index 3, scale 1, translateY 0). Background card scale 0.96/translateY -12, back-back 0.92/-24. Drag-handlers вешаются ТОЛЬКО на top card. `document.querySelector('.vvz-card')` вернёт самую заднюю — для теста бери `querySelectorAll('.vvz-card')[length-1]`.
- Photo использует `i.pravatar.cc/600?img=N` — Playwright/Chromium ругается `ERR_CERT_AUTHORITY_INVALID`, фото не грузится. Стаб через `page.route('https://i.pravatar.cc/**', ...)` с 1×1 PNG работает. Реальный браузер пользователя cert примет, не регрессия.
- Подложка из back-cards визуально почти НЕ видна, пока top card стоит на месте: back cards уже на ~6.5px с каждой стороны и выше, plus drop-shadow от top card. Видно только когда top card сдвинут (drag/fly).
- Drag — `pointerdown` на карточке + `pointermove`/`pointerup` на window. Tinder-формула: rotate = dx/16, stamp-opacity = min(1, |dx|/120). Порог fly: |dx| > 120.
- Tap-кнопки: `#vvz-skip`/`#vvz-like` → `fly('skip'|'like')` → 320ms трансформа off-screen + 300ms cooldown → новый render. Очередь: первые 3 видны, по мере fly() подтягиваются следующие.
- Empty-state: после исчерпания массива `PEOPLE` — `.vvz-empty` display:none → flex, кнопки `disabled=true` (`pointer-events:none`, opacity 0.36).
- Чтобы шёл правильный `PointerEvent` через `dispatchEvent`, обязательно `pointerType:'touch'`, `pointerId:1`, `isPrimary:true`. `page.mouse.down/move` в `isMobile:true`-контексте у меня НЕ триггерил `pointerdown` на этой странице — drag не начинался.

## Окружение
- `python3 -m http.server 8765 --bind 127.0.0.1` — поднимает статику из репы. Один и тот же порт; перед стартом проверять, не поднят ли уже (`curl 127.0.0.1:8765`).
- Playwright: `/opt/node22/lib/node_modules/playwright`, запуск через `NODE_PATH=/opt/node22/lib/node_modules node /tmp/<name>.js`. Версия 1.56.
- Контейнер ephemeral, всё временное → в `/tmp/`. Скриншоты тоже.

## Селекторы и интеракции по страницам

### moment-viewer (bday-сториз на lenta-q3) — 2026-06-11
- Лиза-сториз = `.stories-row .avatar[data-bday][data-name="Лиза"]` (радужное кольцо `__ring-active` + 🎂-бейдж `.stories-row__bday-badge`). ВВЗ-сториз = `.stories-row .avatar[data-stories]:not([data-bday])`.
- ~~app-shell.css НЕ подключён~~ → **FIXED commit 4a58308**: `index.css:72` теперь делает `@import url('./components/app-shell.css');`. Подтверждено: lenta-q3.html открывается БЕЗ инжекта, `.phone-frame.__fullscreen` = 844px (== viewport), docH=844 — никаких 6800px больше нет. Viewer и шары рендерятся в первом viewport «из коробки».
- Закрытие viewer'а: кнопка × в `.moment__topbar .button-inline:last-child` (`aria-label` отсутствует). **НЕ закрывается** ни force-click через Playwright, ни вызовом `.click()` из page.evaluate — viewer не реагирует. Альтернативы: `page.goto(...)` (полная перезагрузка) или nav-зоны внутри слайдов.
- Pointer-intercepts: `.moment__nav-zone.__side-prev/__side-next` (центр левая/правая половины), `.moment.__fullscreen` сам перехватывает всё → на клик «.stories-row .avatar» поверх viewer Playwright не пускает.
- `MomentViewer.prototype.go(index)` (moment.js:79) **пересоздаёт `.moment__bday-balloons` innerHTML на каждом переходе** между слайдами (см. commit b037b70). Эмпирически подтверждено: клик в `.__side-next` → клик в `.__side-prev` → балунный слой создан заново, на +17ms после клика opacity 0.83/0.64/0.31, translateY 89/190/411 — анимация перезапустилась с нуля. **ВАЖНО**: ловить mid-flight нужно ДО первого `waitForTimeout` — `page.waitForSelector('.moment__bday-balloon')` сразу после клика возвращает через ~17ms, и снимать кадр в этот момент.
- bday-карточка содержит push-уведомления `#notifs` поверх viewer'а — для чистого скриншота их прячь: `#notifs, .ok-notif, .notif-card { display:none !important; }` через addInitScript.
- Фон-фото (i.okcdn.ru) даёт `ERR_CERT_AUTHORITY_INVALID` в Playwright и не грузится — фотография девушки на bday-слайде отсутствует, фон чёрный. Не регрессия, особенность теста.

### bday-balloons файлы↔классы (commit e25cbd7, после свопа — verified 2026-06-11)
- `__b-poodle` (left:-27% top:47% rotate:-12.74° width:70%, delay 0.05s) → `assets/icons/шарик_1 2.png` = **зелёный пудель** (491×491). Сходится с контрактом.
- `__b-ok` (left:12% top:27% rotate:0° width:68%, delay 0.18s) → `assets/icons/шарик_1 4.png` = **оранжевый ОК-шар**. Сходится.
- `__b-round` (left:37% top:36% rotate:10.68° width:77%, delay 0.30s) → `assets/icons/шарик_1 8.png` = оранжевый круглый. Сходится.
- Финальные координаты (390-wide, без фрейма-карточки .moment 390×844): poodle left=-132 top=370 w=326; ok left=47 top=228 w=265; round left=119 top=279 w=351. Поверни ↔ замени `__b-*` ↔ замени PNG — все три измерения должны двигаться синхронно.
- Анимация: animationName=`bday-balloon-rise`, duration 1.1s, timing `cubic-bezier(0.22,1,0.36,1)`, fill `both`. Computed transform matrix-углы соответствуют CSS rotate (0.9753=cos(-12.74°), 0.9827=cos(10.68°)).
- `aspect-ratio:1` + `object-fit:contain` на не-квадратных PNG → визуальный шар уже bbox-а: poodle/round визуально шире-уже центральной полоски своего bbox-а. Это важно при оценке «лежит ли шар где надо».

### start.html
- Локскрин `.lockscreen` — клик в любое место разблокирует. **Кликать ниже области пушей** (например `page.mouse.click(195, 720)`), иначе пуш в верхней зоне ловит клик первым → unlock не срабатывает.
- Меню (после анлока): `.home-grid .app` — кнопка приложения «ОК». Тап стартует splash-анимацию.
- Google-серч-бар на меню: `.search-bar`. Клик блокирует телефон обратно (через `history.back()` → popstate → lockDevice).
- Лого-сплэш `#splash`, лого-аватар на полёте `#launch`.

### lenta-light.html / lenta-q3.html
- Sentinel-state + popstate-листенер. С commit'а с back-trap.js — state теперь `{scr:'__back-trap'}` (компонент `components/back-trap.js` с `data-target="start.html"`). На popstate dispatch'ит `back-trap:before-navigate` (хост ставит `okstart_at_home=1`) и делает `window.location.replace('start.html')`.
- `page.goBack()` теперь работает корректно: ушёл с lenta-q3 → start.html → unlocked menu (через pageshow + atHome-флаг + `showHomeInstant()`). Никакой петли в реальном back нет (replace навигирует на другой URL, не возвращается на lenta).
- **ВАЖНО для тестов**: НЕ ставь `addInitScript(() => sessionStorage.clear())` — он сработает на КАЖДОЙ навигации, включая lenta→start, сотрёт `okstart_at_home` ровно перед тем как start.html его прочитает на pageshow, и тест провалится: «вместо меню приземлились на локскрин». Если нужно начать чисто — открой пустую страницу, очисти, потом navigate на start.html. Либо просто не очищай, новый контекст браузера и так чистый.

### components/back-trap.js (новое, 2026-06-11)
- Универсальный «back возвращает на target» компонент: `<script src="components/back-trap.js" data-target="..."></script>`. Подключён в lenta-q3.html, заменил инлайн-IIFE.
- Перед navigate стреляет `back-trap:before-navigate` — хост слушает и пишет в sessionStorage то, что нужно увезти в target.

### components/lockscreen.js + lockscreen.css (новое, 2026-06-11)
- Вытащен из start.html: вешает pointerdown/move/up на `.lockscreen`, на свайп вверх / короткий тап стреляет `lockscreen:unlock` на document. Хост слушает и сам делает `.device.classList.add('unlocked')`, pushState, и пр.
- На свежей загрузке start.html инициализируется на DOMContentLoaded, успевает к первому юзер-инпуту. `el.__lockWired === true` после wiring (можно проверить в тесте).

### gifts.html (verified 2026-06-11 — CTA «Принять все» видимость)
- `.gp__bottom` = position:absolute; left:0; right:0; bottom:24px; z-index:5; display:flex; **высота 56px** (button-wrapper __size-56). bbox на 390×844: top=764, left=0, w=390, h=56 → bot=820 (handle 24px ниже). Всегда в viewport.
- Виден во ВСЕХ 4 стейтах: state-1 (initial, карты opacity 0), state-4 (ряд), state-5 (после клика «Принять все», title=312px), и после поштучного accept (state остаётся `__state-4`, title через `showAllAccepted()` без перехода в state-5 — слегка несимметрично с «Принять все»-флоу, но btn видна одинаково).
- Конфликтов z-index НЕТ: `.meshok-up` z=5 но `display:contents` (height 0), `.gp__handle` z=auto под кнопкой, `.gp-confetti` z=20 но `pointer-events:none` — визуально оверлеит, но клики проходят. `elementsFromPoint` в центре кнопки даёт `.button-content > #gpAcceptAll > .button-wrapper > .gp__bottom` — никаких перекрытий.
- **СВАЙП-АКЦЕПТ ловушка**: accept-strip в `.gift-card__accept` появляется только когда у карты есть класс `__active` (выставляется через `setActiveAll(true)` в `attachSwipe()` при `|panOffset|>=1`). После snap-back panOffset→0 и `__active` снимается → strip скрыт. Кликнуть accept через `page.mouse.click(x,y)` НЕ выйдет, потому что после отпускания пальца strip уходит. Решение: **программный** `el.click()` через `page.evaluate` — listener `accBtn.addEventListener('click', ...)` срабатывает напрямую без pointer-флоу. Это надёжно процессит accept-цепочку FILL(700)+FLY(600)+SHIFT(350)ms.
- Цикл анимации до state-4: SPRING.delay 500 + state1→2 spring 2000 + PAUSE 800 + 2→3 300 + 3→4 600 = **4200ms** от load до settled state-4. `page.waitForFunction(() => gp.classList.contains('__state-4'))` + ещё ~800ms на settle.
- При acceptAll (клик `#gpAcceptAll`): spring 1→веер (600ms) → 1ms delay → bezier exit (500ms) → showAllAccepted. State становится `__state-5`. Title едет на top=312, но `.gp__bottom` НЕ двигается.
- `.gp-confetti` z=20 покрывает весь экран НО `pointer-events:none` — клики по кнопке проходят сквозь конфетти OK.

### components/app-launch.js + app-launch.css (новое, 2026-06-11)
- Вытащен из start.html. Тап по `.app[data-launch="<url>"]` стартует splash-анимацию и навигирует.
- Атрибут переименован: было `data-href`, стало `data-launch`. Если ищешь иконку в DOM — селектор сейчас `.app[data-launch]`.
- Перед стартом dispatch'ит `app-launch:start` на document — хост (start.html) ставит `okstart_at_home=1`.

### guests.html (2026-06-11)
- Viewport 360×800: статусбар + навбар «Гости» сверху, баннер «Невидимка» в шапке. Тайтл — `.ds-title-s`, bg на нём `rgba(0,0,0,0)` — оранжевая подложка задаётся родителю-карточке, не самому тайтлу. Проверяй цвет на 1–2 уровня выше.
- Тоггл: `.ll-switch` 52×32.
- Заголовки секций: класс `.header__title` (НЕ `h2/h3`). Для «Возможно вы знакомы» — `.ll-pymk__title.ds-title-l`. Кнопка «Ещё» = `.button-inline__content`.
- Аватары: `.avatar.__size-56` (56×56) + онлайн-точка `.avatar__addon.__pos-bl` (12×12).
- friend-card: 220×330. Close — 24×24 (`.friend-card__close.button-circle-wrapper.__size-24.__style-o`). CTA-текст «Дружить».
- Таббар `.ll-tabbar`, position:fixed; на 360×800 top=727, height=73.
- Консоль: только `ERR_CERT_AUTHORITY_INVALID` для i.okcdn.ru аватарок — особенность контейнера, не баг страницы.

## App-shell / fullscreen layout (lenta-q3, messages, notifications, tribune, gifts)
Эти 5 экранов используют `.phone-frame.__fullscreen` shell (components/app-shell.css, импорт в index.css, commit b82939e). Структура (проверено браузером, идентична по числам PRE/POST рефактора):
- `.phone-frame.__fullscreen`: width:100%, height/min-height:100dvh, overflow:hidden. Фон НЕ задаётся в app-shell — берётся базовый `.phone-frame { background:base-primary }` (phone-frame.css) либо локальный override на странице (messages/notifications/tribune/gifts ставят `secondary`). На 390×844 frame = 0..844, fills viewport.
- Скроллер — `.phone-frame__feed` (overflow-y:auto, min-height:0). НЕ body: `document.scrollingElement` не скроллится (bodyScrolls=false на всех). Скриптом скроллить именно feed: `feed.scrollTop = feed.scrollHeight`.
- `.ll-tabbar`: position:**fixed**, bottom:0, z:50. На 390×844 → top=771, bottom=844, height=73. Остаётся top=771 до и после скролла (не уезжает). gifts таббара НЕ имеет.
- `.ll-fab` (messages): position:fixed, z:60, bottom~760 → НАД таббаром (barTop=771). 
- gifts: НЕ имеет feed-scroll и таббара. flex-column от базового `.phone-frame` (app-shell не задаёт display). Карточный веер + CTA «Принять все» внизу + крестик в шапке.
- `.meshok-up` = `display:contents` обёртка (zero-height, top репортит как 0 — не путать со «sticky»). Sticky ВНУTRи неё **только** `.status-bar` (top:0, height 44). nav-bar и chips НЕ sticky — при скролле фида уезжают вверх. Это by design, не регрессия. «Header stays at top» = именно status-bar (top=0 до/после скролла на всех экранах). Для tribune «chips sticky under header» — chips живут внутри meshok-up, едут со status-bar только пока тот в потоке; при прокрутке фида сами chips уходят (ожидаемо).
- Брокен-картинки (avatar/media glyphs) на feed-экранах — это отсутствующие remote-ассеты по HTTP, не связано с layout-рефактором (есть и в PRE).

### Рецепт: верификация «PURE refactor → IDENTICAL»
1. Рефактор мог УЖЕ закоммититься во время сессии (хук/автосейв). Проверяй `git log --oneline` — baseline тогда HEAD~1, а не working tree. `git stash` ничего не возьмёт, если уже committed.
2. Baseline: `git checkout HEAD~1 -- <files>` (untracked новый компонент типа app-shell.css остаётся — это ок, страницы PRE его всё равно не импортируют). Снять метрики+скрины, потом `git checkout HEAD -- <files>` вернуть POST.
3. Метрики через page.evaluate: getBoundingClientRect top/bottom/height + computed position/overflow для frame/feed/tabbar/fab/status-bar, до и после `feed.scrollTop=...`. Числа PRE и POST совпали байт-в-байт → доказательство сильнее скрина.
4. Пиксель-диф PNG: загрузить обе base64 в `new Image()` внутри page, нарисовать на canvas, сравнить getImageData (порог на канал-сумму >12). 4/5 экранов дали 0 diff-пикселей. 
5. **gifts даёт ~5–8% pixel-diff даже PRE-vs-POST И POST-vs-POST (сам с собой)** — карточный веер анимируется на загрузке, кадр недетерминирован. Не регрессия. Доказывать gifts метриками (frameH=winH=844, overflow:hidden), не скрином.

## Тайминги (наблюдённые)
- Splash-анимация тапа: **~1100 ms total** (180 ms blur-trigger + 400 ms crossfade + хвост). Ждать переход в ленту: `await page.waitForURL('**/lenta-light.html', { timeout: 6000 })`.
- Анлок-слайд локскрина: **0.5 s** (transform 0.5s cubic-bezier).
- Уведомления:
  - 1-й пуш через `delay` 1-го элемента в `NOTIFS` (по умолчанию 2000 ms от `start()`).
  - Между пушами — `delay` каждого следующего, fallback `NOTIF_GAP` 6000 ms.
  - Lifetime карточки — 30 s (или `data.lifetime`).

## SessionStorage — состояние стрима
- `ok_notif_idx` — индекс следующего пуша (счётчик).
- `ok_notif_next_at` — epoch ms когда прилетит следующий.
- `okstart_at_home` = '1' — флаг, что мы уже за локскрином (start.html на pageshow подхватит и сразу покажет меню без анимации).

Эти три ключа **переживают** анлок, back-to-lock и тап по Поиску — стрим не сбрасывается. Если в тесте нужен чистый старт — вручную `sessionStorage.clear()` до `page.goto`.

## Контейнер пушей `#notifs` и режимы раскладки
- `.__mode-lock` — плоский список (Figma-стиль для локскрина).
- `.__mode-heads-up` — iOS-колода: новая поверх, предыдущие уезжают вглубь (translateY + scale + opacity по depth).
- Переключение режима — JS-вызовы `OkNotifs.setMode('lock'|'heads-up')`.
- На локе `.device .notifs` стоит `top: 254px` (gap 36 после блока время/дата/погода). После анлока `.device.headsup-notifs` → `top: 36px`.

## In-app push (notificationToast) — components/inapp-push.{js,css} (verified 2026-06-12, 390×844, messages.html + preview.html)
ОТДЕЛЬНЫЙ компонент от `#notifs`/system-notifications. Глобал — `window.OkInApp` (НЕ OkNotifs). Контейнер: `<div class="inapp-pushes" id="inappPushes" data-autostart>`. Карточки: `.inapp-push.__type-user` / `.inapp-push.__type-ok`.
- sessionStorage-ключи: `ok_inapp_idx`, `ok_inapp_next_at` (другие, чем у локскрин-стрима `ok_notif_*`).
- Расписание в messages.html: item[0] user `delay:2000`, item[1] ok `delay:6000`. LIFETIME дефолт = 6000, GAP = 6000, MAX_STACK = 3.
- Селекторы внутри: `.avatar.__size-56.__type-image > img` (user, аватар 56 круглый), `.inapp-push__avaicon` (ok, круг с иконкой), `.inapp-push__title.ds-title-s`, `.inapp-push__body.ds-body-m` (только user, `-webkit-line-clamp:2`).
- Измерено user-карточка (full width 390): card w=390 top=48, bg `rgb(255,255,255)`, radius 16px, shadow `rgba(0,0,0,.12) 0 8px 24px -8px` (elevate-3), title fontWeight 600 / 15px, body color `rgba(46,47,51,.88)` 2 строки с …. Аватар 56×56 radius 50%.
- ok-карточка: круг `.inapp-push__avaicon` 56px radius 50%, bg `rgb(0,153,255)` (#0099FF), иконка `assets/icons/web_24.svg` 24px по центру (dx=dy=0), белая через `filter: brightness(0) invert(1)`.
- КОЛОДА (deck): реализована верно — restack() даёт depth0 z=100/translateY(0)/scale(1)/op1, depth1 z=99/translateY(10px)/scale(0.95)/op0.92, depth2 op0.8. Проверено принудительным overlapping (2× fireNext с паузой 400ms → обе карты в DOM, старая ушла вглубь/вниз/потускнела). ✓
- **БАГ/ловушка timing-collision: в ДЕФОЛТНОМ расписании messages.html колода НЕ видна.** user.lifetime=6000 истекает РОВНО когда ok прилетает (ok delay=6000 от user). Прогон `sawBoth` (poll 100ms 9s) → false: user@~1.5s, ok@~7.5s, никогда не сосуществуют. Чтобы реально показать колоду в проде — у user нужен `lifetime` > GAP, либо ok-delay < user-lifetime. Сейчас «ложится поверх предыдущего» в естественном потоке не наблюдается.
- Свайп-дисмисс: drag вверх, порог `dy < -34px` → dismiss (translateY(-150%), opacity0, 0.28s). Проверено `mouse.down` в центре + 10× move по -5px = -50px → карта удалена, контейнер пуст. ✓ Чистый тап (без move>4px) при наличии `data.href` → переход (`location.href`).
- Тест чистого старта: `page.goto` → `sessionStorage.clear()` → `page.reload()`, иначе idx уже продвинут с прошлого визита.
- pravatar.cc (аватар user) не грузится по HTTP в Playwright — placeholder-круг. Не баг компонента.
- preview.html: секция «InAppPush — notificationToast 1.0» (h2). Карты статичные с inline `max-width:360px` (на 390 → реальная w=270, body клампится до ~1.5 строк визуально, но clamp=2 корректен). Верстка целая: radius/shadow/иконка-центр/нет overflow. `el.screenshot()` секции может склипать не туда если секция выше viewport — снимай через explicit `clip` после scrollTo.

## Launch-overlay (`#launch`)
Живёт только во время анимации тапа. После `window.location.href = href` страница навигирует и `#launch` исчезает с DOM.

**Чтобы наблюдать всю анимацию (без навигации):**
```js
await page.route('**/lenta-light.html', r => r.abort('aborted'));
```
Тогда тап стартует splash, но переход не происходит → можно сэмплировать `#launch` через рАF до конца.

## ScreenTransition (push/pop) — components/screen-transition.{js,css}
ПЕРЕПИСАНО на cross-document View Transitions API (commit 68db716). Старый JS-class-механизм (screen-leave-back/screen-enter-* + sessionStorage['screenNavDir']) БОЛЬШЕ НЕ СУЩЕСТВУЕТ — не искать его.
- CSS: `@view-transition { navigation: auto; }`. Дефолт = forward: `::view-transition-new(root)` `screen-in-right` (100%→0), `::view-transition-old(root)` `screen-out-left` (0→-25%). Back через `:active-view-transition-type(back)::view-transition-old(root)` `screen-out-right`(0→100%, z-index:2) + `-new(root)` `screen-in-left`(-25%→0, z-index:1). Длительность 300ms cubic-bezier(.2,0,0,1).
- JS (screen-transition.js): слушает `pageswap`+`pagereveal`, считает направление из Navigation API `activation` (isBack = navType==='traverse' && entry.index < from.index) и делает `e.viewTransition.types.add('forward'|'back')`. Back-кнопка `.nav-bar__back` / `[data-screen-back]` → `history.back()` (или data-href). Forward делает tab-bar.js (`location.href` по ROUTES).
- Chromium поддерживает всё: vtTypeSel/startVT/navAPI/pageswap/pagereveal = true. Cross-doc VT **активируется** на localhost (hasVT:true на pagereveal обоих направлений).

### БАГ (наблюдён 2026-06): BACK играет FORWARD-анимацию. types никогда не доезжает до входящего документа.
- Замер `document.getAnimations()` + keyframes на ВХОДЯЩЕЙ странице: и forward, и back → одинаково `screen-in-right`(new)+`screen-out-left`(old). Back-ветка CSS не матчится.
- Причина: `viewTransition.types` пустой на `pagereveal` (входящий док) во ВСЕХ читках (atFire / next-microtask / rAF = []). add() из pagereveal — no-op. На `pageswap` (исходящий док) add() ВИДЕН только в rAF-читке (['forward']/['back']) — но это уже после создания снапшота, типы в новый док не пробрасываются. Navigation activation корректен (computedIsBack: false для push 1→2, true для traverse 2→1) — логика isBack верна, проблема в моменте/документе применения типа.
- Рывка НЕТ: new(root) стартует чисто с translateX(100%), без snap-to-0-then-jump. Единственный дефект — направление back совпадает с forward.
- Навигации работают: lenta→messages (push, idx1→2), back лендит на **lenta-light.html** (traverse 2→1) — feed-back-trap НЕ срабатывает на этот history.back (sentinel-state в индексе совпадает, popstate-replace в start.html не уводит). final url = lenta-light.html. ОК.
- Консоль: чисто (фильтр `/CERT|404|net::|jsdelivr|lottie|favicon/`), 0 своих ошибок.

### ФИКС html.nav-back в <head> (commit 13f0bf7) — РАБОТАЕТ (наблюдён 2026-06-10)
screen-transition.js теперь подключён синхронным `<script src>` в `<head>` (строка 12-13 в lenta-q3.html/messages.html, до `</head>` на 291). Listener pagereveal регистрируется на парсинге head → ДО fire события. Замер на ВХОДЯЩЕМ lenta-q3 (back, traverse 1→0): register-pagereveal происходит, потом pagereveal-FIRED navType=traverse navBackFlag=1 → CLASS-ADD nav-back ФАЕРИТСЯ (раньше не вызывался ни разу) → navBackClass=true, анимации new=`screen-in-left`+old=`screen-out-right`. Back = системный pop, как и задумано. Forward (lenta-q3→messages, push): navBackFlag=-, нет CLASS-ADD, new=`screen-in-right`+old=`screen-out-left` — регрессия цела. Cross-doc VT активируется на localhost. Главный фид теперь **lenta-q3.html** (бывший lenta-light.html). tab-bar.js: feed→lenta-q3.html, message→messages.html. Иконка таббара «Сообщения»: `.tabbar-icon.__slot-message`.
- ВАЖНО для теста back: нельзя `goto messages.html` первым — history.back уведёт на about:blank (нет предыдущей записи). Сначала grok forward lenta-q3→messages (push), ПОТОМ back. feed-back-trap у lenta-q3 на этот back НЕ срабатывает, лендит на lenta-q3.html.
- Mid-frame анимации: замедли VT через addInitScript-стиль `::view-transition-old/new(root){animation-duration:1500ms !important}` и снимай на ~600ms. На дефолтных 300ms screenshot часто ловит уже досттроенный кадр.

### СТАРЫЙ ФИКС html.nav-back (commit 705b7a3, script в КОНЦЕ body) — НЕ РАБОТАЛ (наблюдён 2026-06-10)
Подход сменили: вместо VT types теперь screen-transition.js на `pagereveal` входящего дока читает sessionStorage['screenNavBack'] (ставится по тапу .nav-bar__back) и делает `documentElement.classList.add('nav-back')`; CSS матчит `html.nav-back::view-transition-old/new(root)`. ИДЕЯ верная, но не срабатывает по таймингу:
- `classList.add('nav-back')` НИ РАЗУ не вызывается (перехват `DOMTokenList.prototype.add` — 0 вызовов).
- ПРИЧИНА (доказано через перехват `window.addEventListener` + `performance.now()`): на входящем lenta-light `pagereveal` ФАЕРИТСЯ при registeredSoFar=0 в t≈84ms, а screen-transition.js регистрирует свой pagereveal-листенер только в t≈126ms (он подключён обычным `<script src>` в КОНЦЕ body). Событие pagereveal — one-shot и стреляет ДО исполнения скриптов конца body → листенер опаздывает на ~40ms → no-op навсегда.
- Флаг и click-хендлер работают: после тапа .nav-bar__back sessionStorage['screenNavBack']==='1', navType на входящем = 'traverse'. Логика верна, мертва только привязка по моменту регистрации.
- Итог замера на ВХОДЯЩЕМ lenta-light (back): navBackClass=false во всех точках (init/micro/rAF), анимации `new=screen-in-right`+`old=screen-out-left` = forward. Back играет FORWARD. Рывка нет (new стартует чисто с translateX(100%)).
- Forward (lenta→messages, push): корректен — new=screen-in-right, old=screen-out-left, nav-back не стоит. Visually messages въезжает справа.
- ЧИНИТЬ: регистрировать pagereveal-листенер РАНЬШЕ pagereveal — либо инлайн-скрипт в `<head>`, либо screen-transition.js в head с defer не поможет (defer = после парсинга). Нужен синхронный inline в head ДО первой отрисовки. Текущее размещение в конце body — гарантированно поздно.
- Навигации ок: back лендит на lenta-light.html (feed-back-trap не уводит). Консоль чистая.

### Как тестировать VT-типы и направление (рабочий рецепт)
- Доказать момент регистрации листенера: перехвати `window.addEventListener` в addInitScript, логируй `register-pagereveal` с `performance.now()`, и отдельным своим листенером логируй `pagereveal-FIRED` с числом уже зарегистрированных. Если FIRED раньше register → листенер мёртв.
- Перехват `DOMTokenList.prototype.add` ловит, добавляется ли класс вообще (надёжнее, чем читать classList постфактум).
- `chromium.launch({ args:['--enable-features=ViewTransitionOnNavigation'] })`.
- `addInitScript`: вешать pageswap/pagereveal, типы читать в 3 момента (synchronous, `Promise.resolve().then`, `requestAnimationFrame`) — иначе пропустишь, что add() виден только в rAF.
- Лог переживает навигацию только через `sessionStorage` (объект window.__vtlog обнуляется на новой странице).
- Направление визуально доказывать НЕ скриншотом, а `getAnimations().effect.pseudoElement` + `.animationName` + `getKeyframes()` на входящей странице сразу после reveal (rAF×4). Имя кейфрейма = бесспорное доказательство ветки.

### Progressive blur 0→80px в bday-шаблоне (наблюдён 2026-06-11, commit d71098e — НОВАЯ схема)
- Структура: `.moment__bday-blur` → 6 × `.moment__bday-blur-step.__b-1..__b-6` + `.moment__bday-blur-tint` сверху.
- НОВАЯ маска (commit d71098e, заменила полосы): `linear-gradient(transparent var(--bday-blur-p), black 100%)`. Только fade-in, без fade-out. У самого низа активны ВСЕ 6 слоёв, итоговый блюр доминируется самым большим (80px). Сверху активен только L1.
- Подтверждённые computed values (через `getComputedStyle().backdropFilter`): __b-1=blur(2px) p=0%, __b-2=blur(5px) p=16%, __b-3=blur(12px) p=33%, __b-4=blur(24px) p=50%, __b-5=blur(44px) p=66%, __b-6=blur(80px) p=83%.
- Визуально (cropped bottom-half на цветном SVG с горизонтальной сеткой и подписями y=0..1600): прогрессия плавная — линии y=0..y=400 чётко читаются (верх), к y=700 уже еле, у y=1100-1300 (где сидит «День рождения / Поздравить») фон полностью ватный, ROW-метки неузнаваемы. Никаких горизонтальных полос/ступенек на стыках слоёв — переход монотонный.
- Старая схема (commit 0d20976, ПОЛОСЫ `from/to`): радиусы 2/6/14/28/50/80, диапазоны [0-20]/[16-36]/[32-52]/[48-68]/[64-84]/[80-100], тоже без видимых ступенек, но к нижней кромке маска каждого слоя возвращалась к 100% black с резкой границей — d71098e это убрал.
- Тест-рецепт для подобных «прогрессивных» эффектов: подменяй background SVG'ом с явно различимыми горизонтальными ориентирами (линии каждые 100 px, текст-метки) — на скриншоте сразу видно, в какой зоне фон уже не читается. Без таких ориентиров крутость блюра на градиенте не оценить.

### MomentViewer bdaySlide — ПОЧИНЕНО (наблюдён 2026-06-11, commit 0922fb1)
- Раньше: `.moment__media` отсутствовал в шаблоне → фото silently dropped, карточка была чёрной; CTA хардкодился `secondary-on-color` (стеклянный) для всех слайдов.
- Фикс: (а) в `createViewer()` в HTML-шаблон добавлены `<img class="moment__media">` и `<div class="moment__scrim">`; (б) в `go()` CTA-style теперь читается из `s.cta.style` (`opts.style || 'secondary-on-color'` как дефолт); (в) `bdaySlide()` передаёт `style: 'primary'`.
- Подтверждено в браузере: media есть (display:block, 390×844, object-fit:cover, src выставлен), scrim есть, CTA wrapper = `__style-primary`, computed bg = `rgb(255, 119, 0)` (DS-orange), text white, лейбл «Поздравить». Header «День рождения Лизы / 3 часа назад» рендерится.
- Закрытие через × ТЕПЕРЬ маркирует viewed — после клика `[aria-label="Закрыть"]` аватарка Лизы получает `__ring-viewed` (раньше оставалась `__ring-active`, маркилось только Escape). data-bday и `.stories-row__bday-badge` (🎂) на аватарке сохраняются после закрытия — это just persistent data атрибуты, не сбрасываются.
- ВВЗ-регрессия: НЕ затронуто. ВВЗ-сториз по-прежнему открывается с тёмным фоном #2E2F33, body-grid из 4 карточек, CTA «Показать всех» = `__style-secondary-on-color` (rgba(255,255,255,0.16)). media display:none когда src не задан (ветка `else if (s.color)` в go() при `s.src` falsy + s.color заданном корректно скрывает <img>).
- Селектор bday-аватарки в стаке: `.avatar[data-bday]` (атрибут без значения). data-name="Лиза", data-stories="1". Ring — псевдоэлемент `[data-name="Лиза"]::before` с conic-gradient (8 hues), анимация `stories-bday-ring 1.6s cubic-bezier(.22,.61,.36,1)`.
- В test container CDN `i.okcdn.ru` блокируется (ERR_CERT_AUTHORITY_INVALID). Чтобы фото-фон в скриншоте был видимым: `page.route('https://i.okcdn.ru/**', r => r.fulfill({contentType:'image/svg+xml', body:'<svg...>...</svg>'}))` — подменяет на цветной SVG, по которому видно, что media действительно занимает всё полотно.

## Сэмплинг анимаций
- Для покадровых данных: запусти `requestAnimationFrame`-цикл **внутри страницы** через `page.evaluate(async () => new Promise(resolve => { ... }))` и собирай computed styles в массив. Возврат массива на хост даст ~16 ms точность.
- `page.screenshot` блокирующий, ~50 ms на кадр — для покадровой анимации использовать `Page.startScreencast` (CDP-сессия): `const cdp = await page.context().newCDPSession(page); cdp.send('Page.startScreencast', ...);`. Получишь по кадру на каждый paint без подтормаживания.

## Грабли (повторно не наступать)
- **Single `requestAnimationFrame` после `classList.add('animate')` мало для последующего transition** — нужно double-rAF, иначе браузер схлопывает оба style recalc в один и transition не срабатывает (исторический баг с opacity иконки в полёте). Подробности в git-логе start.html около launch-анимации.
- `transition: ...` shorthand в CSS-правиле — **полностью переопределяет** предыдущий transition при одновременном применении классов. Если у тебя `.is-animating { transition: top, left }` и `.is-faded { transition: opacity, filter }`, при наложении классов сработает только последний по cascade-порядку. Решение: либо все transition держать в одном правиле, либо в обоих правилах писать **полный** список свойств.
- В Figma-схожем макете при PNG-плитке с прозрачными углами и контейнере с фоновой заливкой → через углы проглядывает фон контейнера. Если иконка уже squircle — убирать заливку у контейнера (`background: none`), а тень через `filter: drop-shadow` (она следует за alpha PNG, не за прямоугольником).

## Отдача пользователю
- `SendUserFile` в subagent-окружении может быть НЕ доступен (ToolSearch может не находить). Тогда: показывай скриншоты через `Read` на PNG из `/tmp` — кадр попадает в транскрипт, родительский агент его видит. Пути указывай абсолютными в финальном тексте.
- Если `SendUserFile` всё-таки доступен — лучше одним вызовом со списком файлов и общей подписью.
- Подтверждено 2026-06-11 ещё раз: `ToolSearch select:SendUserFile` вернул «No matching». Сразу идти через `Read` на PNG.

## lenta-q3.html — memory-карточки (наблюдено 2026-06-11)
- Скроллер фида = `.phone-frame__feed`, не window. Скриптом: `feed.scrollTop += (target.getBoundingClientRect().top - feed.getBoundingClientRect().top) - 60`.
- Карточка «7 лет назад в этот день»: article #4 в фиде (idx 3 из 14), верстается на ~1393px от верха feed-контента. Все DS-токены попадают: title fontSize 27px / 600, eye-icon 16×16, share-btn primary orange (255,119,0), more-btn secondary 52×44, like-аватары `__size-36` рендерятся 40×40 в стеке (вероятно за счёт border-обводки в avatars-view — это норма для overlap-стека).
- Карточка «Вас отметили на фото 2 года назад»: article #14 (idx 13). Avatar `__size-72` сверху без uni-cell (имени/времени нет — подтверждено `card.querySelector('.uni-cell')===null`). Media full-bleed: `width:390px`, `left:0`, `right:390` — точно касается боковых краёв island'а (cardLeft/cardRight тоже 0/390). Container `.text-feed` имеет `overflow:hidden` + `borderRadius:20px` + `padding:0` по горизонтали — поэтому full-bleed внутри скруглённого острова работает. Tooltip-wrapper `__view-primary __side-bottom __placement-bottom-start`, bg `rgb(26,26,28)` (тёмный), white text, хвостик 12×6 над углом — рендерится корректно. Share-btn один, width 358 (full-width в padding-16), `__pinned-end`/more-btn отсутствует (buttonCount=1).
- Удалённые ассеты (avatar img от pravatar, unsplash, okcdn) в локальном Chromium НЕ грузятся (показываются placeholder-иконкой), но это не влияет на layout-чек.
- Карточка «В браке с Сергеем уже 7 лет 💜»: верстается корректно. Avatars `__size-72`: 1-й ml=0, 2-й ml=**-12px** (overlap слева, как в спеке). Title 27px/600. Subtitle `ds-body-m` единственный. Inline-link «Указать дату годовщины и годы брака» color `rgb(215, 98, 0)` (#D76200), иконка edit_16_20.svg 16×16 слева. Mosaic: верхнее фото 388×198, ряд из 3 миниатюр 125×120 каждая. На последней оверлей «Ещё 5» — белый текст rgb(255,255,255), фон родителя rgba(131,102,86,0.12). Share-btn `__style-secondary`, width 358, без «···» (`hasEllipsis:false`).
- Карточка «Анна, поздравляем с годовщиной дружбы»: оранжевый постер `.ll-anniv-poster` 358×514 (aspect 0.697, спека ~343/492=0.697 совпадает), borderRadius **19px**, bg = radial-gradient (255,181,107)→transparent + linear-gradient 160deg (255,119,0)→(215,98,0). Avatars 96×96 пара внутри постера сверху. balloons_24.svg 66×66 с transform matrix rotate (-12° по cos/sin) в верхнем-левом, gift_24.svg 96×96 в нижнем-правом. «478 подарков» 34px/700 white. «С 1 июня 2023 года» 15px white. Primary-кнопка «Отправить другу» `__style-primary` bg rgb(255,119,0), width 358, с иконкой.
- ВАЖНО про порт http-сервера: основной dev-port — **8000** (как в задаче), не 8765. Перед стартом curl 127.0.0.1:8000.

### add-friends-sheet.html (verified 2026-06-11) — клон gifts по структуре, 5 стейтов «У вас N новых друзей»
- Цикл стейтов: state-1 (стак, opacity 0) → state-2 (веер) → state-3 (ряд, не используется как остановка) → state-4 (ряд сдвинутый на гаттер 16). Тайминги: SPRING.delay 500 + state1→2 spring 2000 + PAUSE_BETWEEN 800 + 2→3 ease 300 + 3→4 spring 600 = **4200 ms** до settled state-4 (как в gifts).
- DOM: `<main class="fp">`, 3 `.friend-big-card[data-i="1|2|3"]`. data-i отражает порядок стопки (1=front/right, 3=back/left). Имена: i=3 Ольга Вайнер, i=2 Александр Соколов, i=1 Михаил Фёдоров.
- В каждой карточке: `.friend-big-card__photo > img` (i.pravatar.cc — внешний CDN), `__name`, `__caption` (возраст/город), `__mutual` с `.avatars-view .__size-16` + 3 аватара и текстом «N общих друзей», `__accept` с кнопкой «Дружить» (primary orange).
- Сцена: `.fp__bottom > #fpAcceptAll` «Дружить со всеми» — primary 56-button внизу. Виден во всех стейтах, включая финальный (после showAllAccepted) — потенциально «висит без дела», логика блокирует повторный клик через `if (!liveCards.length) return;`, но визуально остаётся. Дизайн-вопрос, не баг.
- Accept-флоу карточки (`processCard`): `__flying-up` класс + transform translate Y -800px + rotate 22° (FLY_DUR 600ms), потом display:none и пересборка `liveCards`, остальные карточки едут с transition 350ms. Если liveCards=0 → showAllAccepted через +350ms.
- AcceptAll: spring state→2 (600ms) → 1ms → bezier state→5 exit (500ms) → showAllAccepted (title заменяется на «Вы подружились<br>со всеми», fireConfetti).
- Конфетти: lottie с jsdelivr.net + локальный `assets/lottie/confetti.json`. В sandbox jsdelivr CDN недоступен → `window.lottie` undefined → fireConfetti silently skip. **В production-окружении с интернетом конфетти отработает**. Тест-замер: `#fpConfetti.children.length === 0`, `hasConfettiSvg=false`.
- Фото i.pravatar.cc и google fonts тоже даёт ERR_CERT_AUTHORITY_INVALID в sandbox — карточки показываются с серыми placeholder и broken-image иконками в углу photo и в avatars-view. Layout/anim работает корректно, только пиксели фото отсутствуют.
- Свайп ряда: `attachSwipe` навешивается по `onDone` стейта 3 (т.е. в момент когда current стал 3 → state-4 активирован). STEP=312 (gap 12 + width 300). Программно эмулируется через `page.mouse.down/move/up`; в mid-swipe карточки сдвигаются translateX на dx, проверено.
- Title рендерится двухстрочно через `<br>` («У вас<br>7 новых друзей»); `textContent` склеит без пробела — это просто свойство DOM API, не верстка.

## PYMK help-card `.friend-card.__help` (verified 2026-06-12, viewport 360×800)
- Финальная карточка PYMK на 4 страницах. helpCount=1 на каждой (guests, friends, lenta-q3, profile). Title «Найдите еще больше друзей», subtitle «Вы можете найти еще больше друзей или одноклассников», 2 link-кнопки «Поиск по контактам» / «Поиск по школам», icon 56×56.
- **Размеры точно равны (НЕ просто близко) обычной .friend-card в ряду**, БЕЗ `align-items: stretch` (rowAlignItems='normal'). Естественная высота help-card подобрана так, что совпадает байт-в-байт с обычными карточками:
  - guests: help 220×330 == regular 220×330
  - friends: help 220×330 == regular 220×330
  - lenta-q3 (vvz-portlet.island): help 220×330 == regular 220×330
  - profile (vvz-portlet, row.__cards-160): help 160×282 == regular 160×282
- На profile карточки УЖЕ́ — это `.vvz-portlet__row.__cards-160` модификатор (профиль использует компактный размер). Запись выше про «.pymk__row.__cards-220 (только guests) → 220» УСТАРЕЛА: классы по факту `.vvz-portlet` + `.vvz-portlet__row`, не `.pymk`. И __cards-160 теперь на profile, не на lenta-q3.
- Класс портлета: `vvz-portlet` (guests/friends/profile) или `vvz-portlet island` (lenta-q3). Row: `vvz-portlet__row` или `vvz-portlet__row __cards-160`.
- Для теста: row.scrollLeft = row.scrollWidth скроллит до конца; help-card — последний `.friend-card.__help` в row.
- На lenta-q3 портлет глубоко в фиде — обязательно `sel.scrollIntoView()` перед измерением/скриншотом.

## PYMK-секция — унифицированный компонент (verified 2026-06-12, viewport 360×800)
- Класс изменился: было `.ll-pymk` / `.ll-pymk__row` / `.ll-pymk__title` — теперь **`.pymk` / `.pymk__row` / `.pymk__header`** на всех 4 страницах (lenta-q3, friends, guests, messages). Старый селектор `.ll-pymk__*` БОЛЬШЕ НЕ РАБОТАЕТ.
- Модификаторы: `.pymk.island` (lenta-q3, добавляет island-обёртку), `.pymk.__messages` (messages.html), без модификаторов на friends/guests.
- Row модификатор: `.pymk__row.__cards-220` (только guests) → ширина карточки **220px** (h=330). Без модификатора — **160px** (h=270 для friend-card, h=218 для vvz-card).
- Row display:flex, overflow-x:auto, gap:8px на всех 4. Все PASS.
- Содержимое: `.friend-card` (lenta-q3/friends/guests) или `.vvz-card` (messages).
- Кнопка-action в `.pymk__header`: «Ещё» на guests, «Скрыть» на messages, отсутствует на lenta-q3/friends.
- Скролл-позиция feed: lenta-q3 scrollTop=1051, friends=264, guests=252, messages=80 — pymk находится глубоко в фиде на lenta-q3 (после 7-летнего-назад), у остальных ближе к верху.

## friends.html — итерация 2 (2026-06-11, re-verified)
- PYMK сейчас рендерится корректно: `.ll-pymk` без `.island` (раньше island клипал overflow + сливал bg). Top=284, h=334. Внутри `.ll-pymk__title.ds-title-l` + `.ll-pymk__row` (h=270, 5 `.friend-card` шириной 160 каждая, x=16 → горизонтальный ряд, gap 8, overflow-x:auto). Bg `rgba(0,0,0,0)` (прозрачный), overflow visible → теперь карточки не клипаются.
- На viewport 360 в кадр попадают 2 целых карточки + 1 обрезанная справа (правильно для horiz-scroll'а). Фото broken (i.pravatar.cc недоступен в sandbox) — это особенность контейнера, layout сам корректен.
- Subtitle «N общих**друзей**» (без пробела перед склонением) — баг markup'а ещё актуален. См. итерацию 1.
- Все секционные заголовки используют один класс `ds-title-l` → computed одинаково: **fs=21px, lh=28px, fw=600**. Совпадает у «Друзья» (h1), «Возможно, вы знакомы», «Важные друзья», «Все друзья». В промтах часто говорят «20/24» — это спецификация дизайна, фактическое значение DS-токена 21/28.
- Ячейки во «Важные/Все друзья» — DS-компонент `.uni-cell-container > .uni-cell` (не самопис row): `.uni-cell` flex-row, **gap 12px**, align-items center; контейнер h=72, внутренний flex h=56. Структура: `.avatar.__size-56` (56×56) → `.uni-cell-additional-content` (column: `.ds-title-s` имя + `.ds-caption-m` сабтайтл) → `.uni-cell-middle-right-content.__compact` (flex-row, **gap 6px**, align-items center, две `.button-inline-wrapper.__size-24`).
- Селекторы для будущих тестов: НЕ ищи `.friend-row` — его нет. Бери `.ll-fr-section .uni-cell-container`. Для PYMK — `.ll-pymk__row > .friend-card`.

## friends.html (итерация 1, 2026-06-11)
- Скроллер — `.phone-frame__feed` (overflow-y:auto, scrollH=1282px при viewport 360×800; после правок ~1298px). bodyScrolls=false; чтобы сделать честный full-page screenshot, нужно временно `feed.style.height = feed.scrollHeight + 'px'; feed.style.overflow='visible'`, потом `page.setViewportSize({w:360, h:scrollH+20})` и `page.screenshot({fullPage:true})`. Прямой `fullPage:true` на дефолтном viewport вернёт только 360×800 (внутренний скролл).
- 4 вкладки в одну строку, на 360 шириной «Вы знакомы» **обрезается** до «Вы знаком» (нет горизонт-скролла у бара, последний таб уезжает за правый край вьюпорта). Видимая проблема — нужно либо уменьшить шрифт/паддинги, либо включить horiz-scroll, либо переименовать.
- Карточки секции «Возможно, вы знакомы» — broken avatar images (нет ресурсов: маленький значок «битой картинки» в углу большого square-placeholder'а и на круглых аватарах рядов). Это про отсутствующие ассеты, не верстка — `<img src>` указывает на CDN, который в контейнере недоступен. Layout сам корректный: квадратное фото с крестиком сверху-справа, имя 16px, сабтайтл «N общих друзей», оранжевая primary-кнопка «Дружить» внизу.
- В подписях есть пропавший пробел: «3 общих**друга**», «12 общих**друзей**» — рендерится слитно. Скорее всего вёрстка из двух inline-нод без пробела между ними или whitespace схлопан.
- Tile «Поиск по контактам» / «Импорт из ВКонтакте» / «Школьные друзья» / «Поделиться профилем»: 2×2 grid, каждая 162×56 (12/186 left, 160/228 top), иконка 24×24 + двустрочный текст. Лейаут чистый.
- «Важные друзья» (2 шт) и «Все друзья» (4 шт) — строки с круглым аватаром 56 + имя + статус + два круглых icon-button'а (envelope + meatballs) справа. Выглядят аккуратно.
- iOS-tabbar внизу: 5 икон (feed/?/messages/?/menu), активная — последняя (оранжевый «гамбургер»). position:fixed, top=727 при 800 высоте viewport — overlap'ит низ контента, но это by design (контент скроллится под ним).
### gifts-catalog.html (наблюдено 2026-06-12, viewport 360×820) — СКРОЛЛ ОПЯТЬ 2 КОЛОНКИ
- На viewport 360×820 грид `.ll-gc-grid` сейчас фактически 2-колоночный: 6 карт `.ll-gift` × 158×186, грид-обёртка island h=674px. Feed scrollHeight=830, clientHeight=820 → overflow ровно 10px, scrollTop max=10. Скролл технически работает, но margin крошечный — последний ряд карточек влезает в кадр почти полностью на дефолтной прокрутке (last card bottom=784 после scrollTo). Title «Подарки» и табы остаются видимыми сверху даже на максимуме скролла.
- `feed.children`: meshok-up (h=0) + `.tabs-view.ll-gc-tabs` (h=48) + `.island.ll-gc-island` (h=674).
- (запись «1 колонка minmax(0,1fr)» из предыдущей итерации — устарела. Сейчас визуально 2 колонки 158-wide, см. screenshot.)
- Карточка `.ll-gift` — flex column, `align-items:center`, `gap:4px`. Постер 1:1, занимает 100% ширины (328×328). Под ним — `.price-tag` 24px.
- **price-tag визуально центрирован под карточкой**, НО его `getBoundingClientRect()` врёт: компонент `.price-tag` имеет `margin-left: 14px` (`--price-tag-tip-width`) — это компенсация под «язычок», который рендерится через `::before` с `right:100%` и торчит ВЛЕВО за пределы body. Реальный визуальный bbox = `[bodyLeft-14, bodyRight]`. На vw=360: cardCenter=180, bodyCenter=187 (+7), visualCenter=180 (с учётом язычка). Δ=0. Если кто-то увидит «тег смещён вправо на 7px» из tag.getBoundingClientRect — это ОЖИДАЕМО, не баг. Чтобы измерять true center — вычитай `--price-tag-tip-width` из left, или мерь по `::before` через CSSOM/range.
- Хедер «Подарки» — в nav-bar (class `ds-title-l ll-sg-navtitle__title-like`). «День рождения!» — внутри `.ll-gc-section-head .header__title.ds-title-l` в острове. Не путать.
- Тап `.ll-gift` → навигация на `send-gift.html?gift=<key>` (через `<a href="send-gift.html?gift=thanks">…`). Работает.

#### Старая запись (2-колоночный вариант, устарела)
- ~~На 360-wide грид `.ll-gc-grid` объявлен `grid-template-columns: 1fr 1fr`, но resolved = `"235px 206px"` — колонки выползали за правый край viewport~~. Фикс применён: `minmax(0, 1fr)` + одна колонка.

### send-gift.html — scroll-metrics (verified 2026-06-12, viewport 360×820)
- Скроллер `.phone-frame__feed`: scrollHeight=921, clientHeight=820 → overflow 101px, что нормально. После `scrollTo({top:scrollHeight})` scrollTop=101 (atBottom=true). Последний друг (`.ll-sg-friend`, h=68) после скролла лежит top=720 / bottom=788 — **полностью виден** над таббарной зоной. 4 friend-rows в списке.
- `feed.children`: meshok-up (h=0) + `.ll-sg-card` (h=461, открытка + CTA) + `.ll-sg-friends` (h=352, секция со списком друзей). На макс-скролле «Сообщение к открытке» и блок «Подарить за 2 OK» остаются видимыми сверху — друзья едут под этой шапкой.

### send-gift.html (наблюдено 2026-06-11) — БАГ в handler «Отправить» per-friend
- В каждой friend-row кнопка `[data-give]` лежит ВНУТРИ `.button-wrapper`, **сразу под `.uni-cell`**, рядом с `.uni-cell-additional-content` (не внутри неё). См. DOM: `.uni-cell > .avatar | .uni-cell-additional-content | .button-wrapper > button[data-give]`.
- Обработчик в `send-gift.html:346` делает `btn.closest('.uni-cell-additional-content').parentNode` → **возвращает null**, поэтому `.parentNode` бросает `TypeError: Cannot read properties of null (reading 'parentNode')`. Доказано: `page.on('pageerror')` ловит этот TypeError на каждом клике, кнопка НЕ заменяется на «Отправлено», тост `#sgToast` остаётся `hidden=true`. Визуально — только hover-подсветка строки (`.uni-cell-container.__state-enabled`).
- Фикс — убрать неиспользуемую строку с `var cell = btn.closest('.uni-cell-additional-content').parentNode;` (переменная `cell` дальше не используется), или поправить на `btn.closest('.uni-cell')`.
- Счётчик `#sgCount` показывает только число, плейсхолдер «/200» статичный → итог в DOM «16/200» (после `fill('С Днём Рождения!')`). Селектор для теста: `#sgCount` (числовая часть), либо ищи текст `/^\d+\/200$/` на родителе.
- meshok-up корректно: `.ds-title-m.ll-sg-navtitle__title` = «Отправка открытки», `.ds-caption-m.ll-sg-navtitle__subtitle` = «На счёте: 79 ОК».

## menu.html — новый экран (наблюдено 2026-06-11)
- Использует тот же fullscreen-shell, что и messages/lenta-q3: `.phone-frame.__fullscreen` (390×844, overflow:hidden), скроллер `.phone-frame__feed` (top:0..844). На свежей загрузке feed.scrollHeight==clientHeight==844 → контент помещается без скролла, прокрутка вниз ничего не двигает. Если контент позже разрастётся — тогда скролл активируется.
- `.ll-tabbar`: position:fixed, top=771, bottom=844, h=73 — стандартное место. На menu.html таббар присутствует и НЕ уезжает при попытке скролла.
- Таббар на messages.html / menu.html содержит 5 кнопок, каждая 78×48, y=772:
  1. `.tabbar-icon.__slot-feed` x=0
  2. `.tabbar-icon.__slot-book` x=78
  3. `.tabbar-icon.__slot-message` x=156 (с `__state-on` на messages)
  4. `.tabbar-icon.__slot-clip` x=234
  5. `.tabbar-icon.__slot-menu` x=312 (≡)
- Селектор иконки меню: `.ll-tabbar .__slot-menu` (или `.tabbar-icon.__slot-menu`). Тап ведёт на `menu.html` (подтверждено finalUrl). На самом menu.html `__slot-menu` должен бы получить `__state-on` — проверять отдельно.

### add-friends-sheet.html — автоплей стопка→веер→ряд (circle→card морф) — 2026-06-12
- Тайминг автоплея ОБНОВЛЁН (commit a4683aa, 2026-06-12): стартовый setTimeout теперь **1000ms** (не 500) — облако стейта-1 «дочитывается» дольше. Цепочка: state-1 cloud держится t=0..~1000; transitionTo(1)=спринг dur 2000 → state-2 settle ~T+3000..3150; затем `PAUSE_BETWEEN=800`; transitionTo(2) ease 300; transitionTo(3) спринг 600. Эмпирически: T+400 → `__state-1`; T+1400 → `__state-2` НО ещё в полёте (НЕ в центре!); state-2 реально схлопнут в центр ~T+3050; ряд `__state-4 __cards-revealed` ~T+4877. ВАЖНО: старые тайминги (T+1400=state2-settled, T+3500=row) уже НЕ верны — всё сдвинулось на ~+1.9с.
- Облако стейта-1 (НОВОЕ, commit a4683aa): 7 кругов разбросаны. 3×`.friend-big-card` центры (390-vp, замерено): i=2 крупный ⌀253 правый-верх (304,315); i=1 ⌀183 (234,534); i=3 ⌀155 левый (95,452). 4×`.fp-decor` мелкие: A ⌀90 (93,321), B ⌀80 (97,544), C ⌀74 правый (351,435), D ⌀38 (132,589). Разброс по X ~95..351, по Y ~315..589 — реально облако, НЕ стопка. К state-2 все съезжаются к (~185..228, ~440..470). decor.cx-230 offset в applyDecor (translate base 230/50) — учитывай при сверке с STATES-координатами (там 360-сетка, центр 180).
- Кружочный вид (стейты 1-2): `.friend-big-card__photo` computed `border-radius:50%`, `margin-top:80px`, `.friend-big-card__info` opacity:0, карточка `background:transparent`/`border transparent`. В ряду: photo radius `36px 36px 0 0` (скруглён только верх, низ плоский — НЕ круг), margin-top:0, info opacity:1, bg белый rgb(255,255,255), border rgb(231,231,231). Подтверждено замерами.
- Морф РЕАЛЬНО анимирован (transition, не class-swap): сэмплы border-top-left-radius `50%`→`calc(48%+1.4px)`→...→`calc(5.4%+32px)` и margin-top `80px`→`8.6px`→0 за ~12 кадров. Флаг `.__cards-revealed` ставится при `toIdx>=2` и фиксирует карточный вид навсегда (возврат в веер по «Дружить со всеми» не сворачивает обратно в кружки).
- Кнопки «Дружить» на самой карточке НЕТ (`.friend-big-card__accept` удалён из DOM, `acceptExistsInDom:false`). Внизу шторки `.fp__bottom` = «Дружить со всеми» (одна общая CTA).
- Финальная карточка: квадратное фото сверху + центрированный инфо-блок (имя «Ольга Вайнер», «58 лет, Москва», «18 общих друзей» с тремя аватарками `__size-36`). Соседние карточки видны как ряд (свайп).
- Фото и mutual-аватарки = `i.pravatar.cc/...` → в Playwright не грузятся (broken-image иконка в углу фото-зоны). Форму/радиус/лейаут это не мешает проверить. Не регрессия.
- Селектор передней карточки в ряду: `.friend-big-card[data-i="3"]` (Ольга). Ждать ряд: `waitForFunction(() => fp.classList.contains('__cards-revealed'))`.
- reduced-motion путь сразу прыгает в `__state-4 __cards-revealed` (без морфа) — кружочного состояния там не увидишь.
- Сетка быстрых действий: `.ll-quick__tile` — серые плашки. На 390-wide их **8 шт**, каждая **83.5×83.5** (квадрат), `aspect-ratio: 1 / 1`, display:flex. Квадратность держится через CSS `aspect-ratio`, не на жёсткой height. Verified 2026-06-12: PASS.
- **Шторка-менюшка `.tabbar-menu-sheet` (components/tab-bar.js, verified 2026-06-12: PASS)**: создаётся ЛЕНИВО на первый openSheet() — до тапа в DOM её НЕТ (`querySelector('.tabbar-menu-sheet')===null`). Триггер: повторный тап по активному `.tabbar-icon.__slot-menu.__state-on` (handler в tab-bar.js:138, ветка `btn.classList.contains('__state-on') && __slot-menu` → openSheet). openSheet добавляет `.__open` внутри одного rAF; transition доезжает за <400ms. После тапа: `transform=matrix(1,0,0,1,0,0)` (translateY(0), НЕ 100%), opacity 1, rectTop=503 (выезжает снизу, h=341 при vh=844), backdrop `.tabbar-menu-sheet__backdrop.__open` тоже появляется. Закрытие — клик по backdrop / свайп вниз >60px. data-href клик в menu.html (строка 263) к шторке отношения не имеет — это отдельный делегат.

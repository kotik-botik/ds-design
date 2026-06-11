# MEMORY — screenshot-testing для ds-design

Накопленные находки по тому, как этот прототип на самом деле себя ведёт в браузере. Дополняй после каждого прогона; устаревшее — удаляй или коротко обобщай.

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

## friends.html (наблюдено 2026-06-11)
- Скроллер — `.phone-frame__feed` (overflow-y:auto, scrollH=1282px при viewport 360×800). bodyScrolls=false; чтобы сделать честный full-page screenshot, нужно временно `feed.style.height = feed.scrollHeight + 'px'; feed.style.overflow='visible'`, потом `page.setViewportSize({w:360, h:scrollH+20})` и `page.screenshot({fullPage:true})`. Прямой `fullPage:true` на дефолтном viewport вернёт только 360×800 (внутренний скролл).
- 4 вкладки в одну строку, на 360 шириной «Вы знакомы» **обрезается** до «Вы знаком» (нет горизонт-скролла у бара, последний таб уезжает за правый край вьюпорта). Видимая проблема — нужно либо уменьшить шрифт/паддинги, либо включить horiz-scroll, либо переименовать.
- Карточки секции «Возможно, вы знакомы» — broken avatar images (нет ресурсов: маленький значок «битой картинки» в углу большого square-placeholder'а и на круглых аватарах рядов). Это про отсутствующие ассеты, не верстка — `<img src>` указывает на CDN, который в контейнере недоступен. Layout сам корректный: квадратное фото с крестиком сверху-справа, имя 16px, сабтайтл «N общих друзей», оранжевая primary-кнопка «Дружить» внизу.
- В подписях есть пропавший пробел: «3 общих**друга**», «12 общих**друзей**» — рендерится слитно. Скорее всего вёрстка из двух inline-нод без пробела между ними или whitespace схлопан.
- Tile «Поиск по контактам» / «Импорт из ВКонтакте» / «Школьные друзья» / «Поделиться профилем»: 2×2 grid, каждая 162×56 (12/186 left, 160/228 top), иконка 24×24 + двустрочный текст. Лейаут чистый.
- «Важные друзья» (2 шт) и «Все друзья» (4 шт) — строки с круглым аватаром 56 + имя + статус + два круглых icon-button'а (envelope + meatballs) справа. Выглядят аккуратно.
- iOS-tabbar внизу: 5 икон (feed/?/messages/?/menu), активная — последняя (оранжевый «гамбургер»). position:fixed, top=727 при 800 высоте viewport — overlap'ит низ контента, но это by design (контент скроллится под ним).
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

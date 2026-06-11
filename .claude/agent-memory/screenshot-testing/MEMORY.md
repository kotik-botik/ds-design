# MEMORY — screenshot-testing для ds-design

Накопленные находки по тому, как этот прототип на самом деле себя ведёт в браузере. Дополняй после каждого прогона; устаревшее — удаляй или коротко обобщай.

## Окружение
- `python3 -m http.server 8765 --bind 127.0.0.1` — поднимает статику из репы. Один и тот же порт; перед стартом проверять, не поднят ли уже (`curl 127.0.0.1:8765`).
- Playwright: `/opt/node22/lib/node_modules/playwright`, запуск через `NODE_PATH=/opt/node22/lib/node_modules node /tmp/<name>.js`. Версия 1.56.
- Контейнер ephemeral, всё временное → в `/tmp/`. Скриншоты тоже.

## Селекторы и интеракции по страницам

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

### components/app-launch.js + app-launch.css (новое, 2026-06-11)
- Вытащен из start.html. Тап по `.app[data-launch="<url>"]` стартует splash-анимацию и навигирует.
- Атрибут переименован: было `data-href`, стало `data-launch`. Если ищешь иконку в DOM — селектор сейчас `.app[data-launch]`.
- Перед стартом dispatch'ит `app-launch:start` на document — хост (start.html) ставит `okstart_at_home=1`.

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

## tab-bar.js навигация (verified 2026-06-11, ВСЁ PASS)
- ROUTES: feed→lenta-q3.html, book→tribune.html, message→messages.html. Селектор иконки `.tabbar-icon.__slot-<feed|book|message>`. Подключён на lenta-q3 / messages / notifications / tribune.
- Активная вкладка имеет класс `.__state-on` (на feed-иконке lenta-q3) → click-хендлер делает early-return, навигации/перезагрузки НЕТ (подтверждено: framenavigated=false, url не меняется).
- Переход forward = cross-document View Transitions API ФАЕРИТСЯ (`e.viewTransition` truthy на pagereveal входящего дока) → 300ms push-left. Tabbar = forward всегда (нет sessionStorage[BACK_KEY], navType≠traverse), поэтому back-ветка не задействована — это к лучшему (см. баг back-направления выше, к таббару не относится).
- Рецепт детекта VT: `addInitScript(() => window.addEventListener('pagereveal', e => window.__vt = !!e.viewTransition))`, после waitForURL читать `page.evaluate(()=>window.__vt)`. Default chromium.launch() (без флага) уже даёт VT на localhost.
- Тап через `.locator(sel).click({force:true})` + `page.waitForURL('**/<file>')`. 5 forward-нав + 1 active-noop отработали с первого прогона, селекторы стабильны.
- RE-VERIFIED 2026-06-11 (6/6 PASS): s1 lenta→messages, s2 lenta→tribune, s3 messages→lenta, s4 tribune→messages, s5 notif→lenta — все navigated с `e.viewTransition` truthy (vt=true, cross-doc VT играет на каждом forward). s6 messages active message-tab (`__state-on`=true подтверждён в DOM) → framenavigated=false, url не изменился за 1.5s → no-op подтверждён. Драйвер: /tmp/tabbar.js.

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

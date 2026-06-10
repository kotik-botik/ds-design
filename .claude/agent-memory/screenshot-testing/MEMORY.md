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

### lenta-light.html
- Sentinel-state + popstate-листенер: на загрузке пушит `{scr:'feed-back-trap'}` и любой Back редиректит в `start.html` через `window.location.replace`. **Не вызывай `page.goBack()` в тестах** — попадёт в петлю с replace-навигацией. Если надо вернуться на меню, лучше навигируй явно: `await page.goto('http://127.0.0.1:8765/start.html')` с `okstart_at_home=1` уже в sessionStorage.

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

### ФИКС html.nav-back (commit 705b7a3) — НЕ РАБОТАЕТ (наблюдён 2026-06-10)
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

## Сэмплинг анимаций
- Для покадровых данных: запусти `requestAnimationFrame`-цикл **внутри страницы** через `page.evaluate(async () => new Promise(resolve => { ... }))` и собирай computed styles в массив. Возврат массива на хост даст ~16 ms точность.
- `page.screenshot` блокирующий, ~50 ms на кадр — для покадровой анимации использовать `Page.startScreencast` (CDP-сессия): `const cdp = await page.context().newCDPSession(page); cdp.send('Page.startScreencast', ...);`. Получишь по кадру на каждый paint без подтормаживания.

## Грабли (повторно не наступать)
- **Single `requestAnimationFrame` после `classList.add('animate')` мало для последующего transition** — нужно double-rAF, иначе браузер схлопывает оба style recalc в один и transition не срабатывает (исторический баг с opacity иконки в полёте). Подробности в git-логе start.html около launch-анимации.
- `transition: ...` shorthand в CSS-правиле — **полностью переопределяет** предыдущий transition при одновременном применении классов. Если у тебя `.is-animating { transition: top, left }` и `.is-faded { transition: opacity, filter }`, при наложении классов сработает только последний по cascade-порядку. Решение: либо все transition держать в одном правиле, либо в обоих правилах писать **полный** список свойств.
- В Figma-схожем макете при PNG-плитке с прозрачными углами и контейнере с фоновой заливкой → через углы проглядывает фон контейнера. Если иконка уже squircle — убирать заливку у контейнера (`background: none`), а тень через `filter: drop-shadow` (она следует за alpha PNG, не за прямоугольником).

## Отдача пользователю
- Все полезные скриншоты — **одним вызовом** `SendUserFile` со списком файлов и одной общей подписью, описывающей шаги. Не клади пути в текст — `SendUserFile` сам доставит.

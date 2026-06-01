# ds-design

Зеркало дизайн-системы ОК для прототипирования.
Источник: `gitlab.corp.mail.ru/ok/ODKL/odnoklassniki-frontend-common` + `@ok/ds-tokens`.

---

## Структура

```
ds-design/
├── index.css                   # точка входа — импортирует всё
├── tokens.css                  # CSS custom properties
├── fonts.css                   # OK Sans @font-face (опционально)
├── animations.css              # keyframes + transition-хелперы
├── fonts/                      # OK Sans Display / Text (otf, ttf)
└── components/
    ├── button.css              # Button (56/44/36/28, 6 стилей, состояния)
    ├── button-inline.css       # ButtonInline (текстовая кнопка, 4 размера)
    ├── icon.css                # Icon (svg wrapper, 12–56px)
    ├── uni-cell.css            # UniCell (строка списка)
    ├── uni-card.css            # UniCard (вертикальная карточка)
    ├── content.css             # Content (flex-layout)
    ├── contents-view.css       # ContentsView (вертикальный контейнер)
    │
    ├── avatar.css              # Avatar (24–56px, image / initials)
    ├── pulse-dot.css           # PulseDot (анимированный индикатор)
    ├── category-path.css       # CategoryPath (хлебные крошки)
    ├── feed-post.css           # FeedPost (карточка ленты)
    ├── feed-tabs.css           # FeedTabs (большие табы сверху)
    ├── tab-bar.css             # TabBar (нижняя навигация)
    ├── page-header.css         # StatusBar + NavBar
    ├── comment-input.css       # CommentInput (поле + кнопка отправки)
    └── phone-frame.css         # PhoneFrame (375px-viewport для превью)
```

---

## Подключение

```html
<html class="__ui-theme_enabled __ui-theme_light">
<head>
  <link rel="stylesheet" href="index.css">
</head>
```

Тёмная тема: `__ui-theme_dark` вместо `__ui-theme_light`.

Чтобы использовать OK Sans вместо Onest, переопредели `--font-family`:

```css
:root {
  --font-family: "OK Sans Text", "OK Sans Display", Onest, sans-serif;
}
```

---

## Конвенция именования

Все интерактивные компоненты следуют паттерну `wrapper → container`:

```html
<div class="button-wrapper __size-36 __style-primary">
  <button class="button-container __style-primary">
    <span class="button-content">Кнопка</span>
  </button>
</div>
```

Модификаторы:
- `__size-N` — высота / тайпография
- `__style-X` / `__view-X` — визуальный вариант
- `__state-enabled` / `__state-disabled` / `__state-loading` / `__state-dragged` — поведение
- `__clicked` — синоним `:active`, можно ставить из JS

---

## Маппинг Lenta-прототипа → DS-компоненты

| Класс в прототипе | Заменяется на | Состояния |
|---|---|---|
| `.btn-sec` | `.button-wrapper.__size-28.__style-secondary` | hover / press / disabled / loading |
| `.btn-sub` | `.button-wrapper.__size-28.__style-secondary` | `+ .__style-primary` когда подписан |
| `.btn-sub.on` | `.button-wrapper.__size-28.__style-primary` | — |
| `.join-btn` | `.button-wrapper.__size-44.__style-primary.__full-width` | + loading при отправке |
| `.nb-btn`, `.adots`, `.c-back` | `.button-wrapper.__size-36.__style-tertiary` + `.icon` | hover / press |
| `.c-send` | `.button-wrapper.__size-36.__style-primary` (border-radius: 50%) | disabled когда поле пустое |
| `.abtn` (like / comment / klass) | `.button-wrapper.__size-36.__style-secondary` + иконка + счётчик | `.__view-liked` на heart |
| `.cmt-like` | `.button-inline.__size-16.__view-tertiary` | hover (opacity 0.84) |
| `.ar-row` | `.uni-cell-wrapper.__state-enabled` | hover / pressed |
| `.cmt` | `.uni-cell-wrapper` | — |
| `.join-card` | `.uni-card-wrapper.__size-custom.__state-enabled` | image-zoom on hover |
| `.pava`, `.ar-ava`, `.nb-ava`, `.cmt-ava` | `.avatar.__size-32/36/40/44` | loading / disabled |
| `.ar-dot` | `.pulse-dot.__view-accent` | paused |
| `.pcat` | `.category-path` | — |
| `.post` | `.feed-post` (+ `.feed-post-header/category/text/media/actions`) | enabled / loading |
| `.tabs` + `.tab` | `.feed-tabs` + `.feed-tabs-tab.__state-on` | on / disabled / clicked |
| `.tbar` + `.tbi` | `.tab-bar` + `.tab-bar-item.__state-on` | on / disabled |
| `.sb` | `.status-bar` | — |
| `.nb` | `.nav-bar` | — |
| `.c-bar` | `.comment-input` | focused / disabled |
| `.phone` | `.phone-frame` | — |

---

## Анимации

Все интерактивные состояния используют один timing:

```
transition: [property] 500ms cubic-bezier(0, -0.3, 0.5, 1.3)
```

| Состояние | Поведение |
|---|---|
| `:hover` | overlay opacity 0.12 |
| `:active` / `.__clicked` | overlay 0.16 + `scale(0.95)` |
| `.__state-loading` | shimmer sweep 2.5s |
| `.__state-highlighted` | diagonal light sweep 1.2s |
| `.__state-dragged` | box-shadow + `scale(0.98)` |
| `.__state-disabled` | opacity 0.36, no pointer events |

---

## Типографика

| Класс | Size / LH / Weight |
|---|---|
| `.ds-display-xl` | 56 / 72 / 500 |
| `.ds-title-xl`   | 27 / 36 / 600 |
| `.ds-title-l`    | 21 / 28 / 600 |
| `.ds-title-m`    | 17 / 24 / 600 |
| `.ds-title-s`    | 15 / 20 / 600 |
| `.ds-body-l`     | 17 / 24 / 400 |
| `.ds-body-m`     | 15 / 20 / 400 |
| `.ds-caption-m`  | 13 / 16 / 400 |
| `.ds-caption-m-accent` | 13 / 16 / 600 |
| `.ds-caption-s`  | 11 / 16 / 400 |

---

## Иконки

Иконки хранятся как SVG в dev-репо:
`design-system/assets/icons/glyphs/{size}/glyph_{name}_{size}.svg`

Размеры: 12 / 16-20 (dual) / 20 / 24 / 24-48 (dual) / 48.

Для прототипа — забирать нужные SVG напрямую из GitLab:

```
https://gitlab.corp.mail.ru/ok/ODKL/odnoklassniki-frontend-common/-/raw/master/design-system/assets/icons/glyphs/16-20/glyph_heart_16_20.svg
```

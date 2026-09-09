# 🎨 Изображения для проекта

## Файлы

### `icon.svg` - Иконка монеты
- Золотая монета с градиентом
- Символ доллара по центру
- Размер: 512x512px
- Использование: иконка приложения, фавикон

### `logo.svg` - Логотип приложения
- Монета на фиолетовом градиентном фоне
- Со звездочками по углам
- Размер: 256x256px
- Использование: логотип, превью в соцсетях

## Как использовать

### В HTML (уже добавлено):
```html
<link rel="icon" type="image/svg+xml" href="images/icon.svg">
<meta property="og:image" content="images/logo.svg">
```

### Для BotFather (отправить фото бота):
1. Конвертируй `logo.svg` в PNG (онлайн или Photoshop)
2. Отправь в BotFather команду `/setuserpic`
3. Загрузи картинку

### Для создания PNG из SVG:
Используй онлайн сервисы:
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/

Или через ImageMagick:
```bash
convert logo.svg -resize 512x512 logo.png
```

## Создание дополнительных размеров

Если нужны разные размеры для App Store / Play Store / веба:
- 16x16 (фавикон)
- 32x32 (фавикон)
- 180x180 (Apple Touch Icon)
- 192x192 (Android Icon)
- 512x512 (Splash screen)
- 1024x1024 (App Store)

SVG легко масштабируется в любой размер без потери качества!

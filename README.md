# Mini App (WebApp) — кафедра ПОКС

Веб-витрина с фильтрами по направлениям, FAQ и контактами. Открывается прямо в Telegram.

## Деплой на GitHub Pages (бесплатно)

1. Создай отдельный публичный репозиторий, например `kstu-bot-webapp`.
2. Скопируй сюда `index.html`, `style.css`, `app.js` **и `bot_data.json`** из корня бота.
3. Settings → Pages → Source: `main` / root → Save.
4. Через 1–2 минуты получишь URL `https://<username>.github.io/kstu-bot-webapp/`.
5. Пропиши его в `.env` бота: `WEBAPP_URL=https://<username>.github.io/kstu-bot-webapp/`.
6. Перезапусти бота — в главном меню появится кнопка «🌐 Открыть мини-приложение».

## Синхронизация данных

`bot_data.json` нужно периодически копировать в репо WebApp. Варианты:
- Вручную — раз в неделю.
- GitHub Action на бота, который пушит JSON при изменении (см. `.github/workflows/sync.yml` — можно добавить позже).
- Или хостить и бота, и статику на одном сервере (Oracle Cloud) и отдавать JSON через nginx.

## Локальный тест

```bash
cd webapp
python -m http.server 8000
```
Открой http://localhost:8000 — без Telegram-обёртки, но всё работает.

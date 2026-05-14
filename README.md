# Mini App (WebApp) — кафедра ПОКС, КГТУ

Веб-витрина с фильтрами по направлениям подготовки, FAQ и контактами кафедры ПОКС. Открывается прямо в Telegram через бот [@POCSKG_BOT](https://t.me/POCSKG_BOT).

## Структура

| Файл | Назначение |
|---|---|
| `index.html` | разметка |
| `style.css` | стили (адаптируются под тёмную/светлую тему Telegram) |
| `app.js` | логика: загрузка `bot_data.json`, фильтры, поиск, рендер |
| `bot_data.json` | контент: направления, FAQ, контакты |

## Деплой на GitHub Pages

В этом репозитории: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.

Через 1–2 минуты URL появится на той же странице (формат: `https://<username>.github.io/kstu-bot-webapp/`).

## Синхронизация контента с ботом

`bot_data.json` хранится в двух местах: рядом с ботом и здесь, в репо Mini App. Когда контент в боте меняется через админ-панель — нужно перезалить файл:

```powershell
cd C:\Users\Dmitry\PycharmProjects\Tg_bot_for_KSTU
cp bot_data.json webapp\bot_data.json
cd webapp
git commit -am "update data"
git push
```

Можно автоматизировать GitHub Action'ом, но это потом.

## Локальный тест

```powershell
cd webapp
python -m http.server 8000
```
Открой http://localhost:8000 — без Telegram-обёртки, но интерфейс рабочий.

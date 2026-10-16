# Конференции.РФ

Портал бронирования помещений для конференций (аудитория, коворкинг, кинозал).
Задание демонстрационного экзамена КИМ 09.02.07-3-2027.

Технологии: Node.js, Express, PostgreSQL, HTML, CSS, JavaScript, Bootstrap.

## Запуск

1. В pgAdmin создать базу `konferencii_rf` и выполнить в Query Tool файл `db/schema.sql`.
2. В `models.js` указать свой пароль от PostgreSQL.
3. Выполнить `npm install` и `npm start`.
4. Открыть http://localhost:3000

Администратор: логин `Conf2027`, пароль `Demo77`.

## Файлы

- `server.js` — сервер и проверка данных
- `models.js` — классы `User`, `Room`, `Booking`, `Review` для работы с базой
- `db/schema.sql` — таблицы и начальные данные
- `db/er-diagram.png` — ER-диаграмма
- `public/*.html` — страницы сайта
- `public/script.js`, `public/style.css` — общий скрипт и стили
- `public/lib` — Bootstrap и Bootstrap Icons
- `public/img` — картинки помещений

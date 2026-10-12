-- =====================================================================
--  Конференции.РФ — запросы для проверки базы данных
--  Выполняются в pgAdmin (Query Tool) по одному: выделите запрос и нажмите F5
-- =====================================================================

-- 1. Все заявки с помещением, заявителем и отзывом (те же данные видит администратор)
SELECT b.id, r.name AS room, to_char(b.start_at, 'DD.MM.YYYY HH24:MI') AS start_at,
       b.payment, b.status, u.full_name, rv.rating
  FROM bookings b
  JOIN rooms r ON r.id = b.room_id
  JOIN users u ON u.id = b.user_id
  LEFT JOIN reviews rv ON rv.booking_id = b.id
 ORDER BY b.id;

-- 2. Статистика по помещениям: сколько заявок, сколько завершено, средняя оценка
SELECT r.name AS room,
       COUNT(b.id) AS total,
       COUNT(b.id) FILTER (WHERE b.status = 'Завершено') AS done,
       ROUND(AVG(rv.rating), 1) AS avg_rating
  FROM rooms r
  LEFT JOIN bookings b ON b.room_id = r.id
  LEFT JOIN reviews rv ON rv.booking_id = b.id
 GROUP BY r.id, r.name
 ORDER BY r.id;

-- 3. Количество заявок каждого пользователя
SELECT u.login, u.full_name, COUNT(b.id) AS bookings
  FROM users u
  LEFT JOIN bookings b ON b.user_id = u.id
 WHERE u.role = 'user'
 GROUP BY u.id, u.login, u.full_name
 ORDER BY bookings DESC;

-- 4. Проверка ограничений: каждый из этих запросов должен завершиться ошибкой
INSERT INTO bookings (user_id, room_id, start_at, payment) VALUES (2, 99, '2026-12-01 10:00', 'Переводом по СБП');  -- нет помещения 99
UPDATE bookings SET status = 'Отменена' WHERE id = 1;                                                        -- недопустимый статус
INSERT INTO reviews (booking_id, rating, text) VALUES (1, 7, 'Оценка вне диапазона');                         -- оценка от 1 до 5
INSERT INTO users (login, password, full_name, phone, email) VALUES ('Conf2027', 'x', 'Дубликат', '8(000)000-00-00', 'a@b.ru'); -- логин занят

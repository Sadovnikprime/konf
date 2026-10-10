// Конференции.РФ — сервер. Запуск: npm start
//
// Страницы сайта — обычные HTML-файлы из папки public.
// Данные они получают и отправляют запросами fetch на адреса /api/...,
// сервер отвечает в формате JSON.

const express = require('express');
const session = require('express-session');
const { User, Room, Booking, Review } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // HTML-страницы, стили, скрипт, картинки
app.use(express.json()); // чтение JSON из запросов
app.use(session({ secret: 'konferencii-rf', resave: false, saveUninitialized: false }));

app.get('/', (req, res) => res.redirect('/login.html'));

// ---------- Проверка прав ----------
// Код 401 означает «нужно войти». Страница, получив его, отправляет на вход

function onlyUser(req, res, next) {
  if (req.session.user && req.session.user.role === 'user') return next();
  res.status(401).json({ error: 'Нужно войти в систему' });
}

function onlyAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.status(401).json({ error: 'Нужно войти как администратор' });
}

// ---------- Регистрация ----------

app.post('/api/register', async (req, res) => {
  const { login = '', password = '', fullName = '', phone = '', email = '' } = req.body;

  // Проверка полей. Ошибки складываются в объект: { поле: 'текст ошибки' }
  const errors = {};
  if (!/^[A-Za-z0-9]{6,}$/.test(login)) errors.login = 'Логин: латинские буквы и цифры, не меньше 6 символов';
  if (password.length < 8) errors.password = 'Пароль должен быть не короче 8 символов';
  if (!/^[А-Яа-яЁё ]+$/.test(fullName)) errors.fullName = 'ФИО: только русские буквы и пробелы';
  if (!/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone)) errors.phone = 'Телефон в формате 8(XXX)XXX-XX-XX';
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Почта в формате name@example.ru';

  // Логин должен быть уникальным
  if (!errors.login && (await User.findByLogin(login))) errors.login = 'Такой логин уже занят';

  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  await User.create({ login, password, fullName: fullName.trim(), phone, email });
  res.json({ ok: true });
});

// ---------- Вход и выход ----------

app.post('/api/login', async (req, res) => {
  const { login = '', password = '' } = req.body;

  const errors = {};
  if (!login) errors.login = 'Введите логин';
  if (!password) errors.password = 'Введите пароль';
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  const user = await User.findByLogin(login);
  if (!user || !(await User.checkPassword(user, password))) {
    return res.status(400).json({ errors: { common: 'Неверный логин или пароль' } });
  }

  // Запоминаем пользователя в сессии
  req.session.user = { id: user.id, role: user.role };
  res.json({ role: user.role });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

// ---------- Помещения (для выпадающих списков) ----------

app.get('/api/rooms', async (req, res) => {
  res.json(await Room.all());
});

// ---------- Заявки пользователя ----------

app.get('/api/bookings', onlyUser, async (req, res) => {
  res.json(await Booking.findByUser(req.session.user.id));
});

app.post('/api/bookings', onlyUser, async (req, res) => {
  const { startAt = '', payment = '' } = req.body;
  const roomId = Number(req.body.roomId);
  const rooms = await Room.all();

  const errors = {};
  if (!rooms.some((room) => room.id === roomId)) errors.roomId = 'Выберите помещение';
  if (!startAt || isNaN(new Date(startAt))) errors.startAt = 'Укажите дату и время начала';
  else if (new Date(startAt) <= new Date()) errors.startAt = 'Дата начала должна быть в будущем';
  if (!Booking.PAYMENTS.includes(payment)) errors.payment = 'Выберите способ оплаты';
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  await Booking.create({ userId: req.session.user.id, roomId, startAt: new Date(startAt), payment });
  res.json({ ok: true });
});

// ---------- Отзыв ----------

app.post('/api/bookings/:id/review', onlyUser, async (req, res) => {
  const { text = '' } = req.body;
  const rating = Number(req.body.rating);
  const booking = await Booking.findById(Number(req.params.id));

  const errors = {};
  // Отзыв можно оставить только к своей завершённой заявке и только один раз
  if (!booking || booking.user_id !== req.session.user.id || booking.status !== 'Завершено' || booking.review_rating) {
    errors.text = 'Отзыв можно оставить только после завершения мероприятия';
  } else {
    if (!(rating >= 1 && rating <= 5)) errors.rating = 'Поставьте оценку';
    if (text.trim().length < 10) errors.text = 'Напишите не меньше 10 символов';
  }
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  await Review.create(booking.id, rating, text.trim());
  res.json({ ok: true });
});

// ---------- Панель администратора ----------

// Фильтр передаётся в адресе: /api/admin/bookings?status=Новая&room=2
app.get('/api/admin/bookings', onlyAdmin, async (req, res) => {
  const status = Booking.STATUSES.includes(req.query.status) ? req.query.status : '';
  const roomId = Number(req.query.room) || 0;
  res.json(await Booking.findAll(status, roomId));
});

app.post('/api/admin/bookings/:id/status', onlyAdmin, async (req, res) => {
  const booking = await Booking.findById(Number(req.params.id));
  const { status } = req.body;

  // Статус меняется на «Мероприятие назначено» или «Завершено». Завершённую заявку изменить нельзя
  const allowed = ['Мероприятие назначено', 'Завершено'];
  if (!booking || booking.status === 'Завершено' || !allowed.includes(status)) {
    return res.status(400).json({ error: 'Статус этой заявки нельзя изменить' });
  }

  await Booking.setStatus(booking.id, status);
  res.json({ ok: true });
});

// ---------- Ошибки сервера (например, нет связи с базой данных) ----------

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Ошибка сервера. Проверьте, что база данных запущена, а пароль в models.js указан верно' });
});

app.listen(PORT, () => console.log(`Сайт запущен: http://localhost:${PORT}`));

const express = require('express');
const session = require('express-session');
const { User, Room, Request, Review } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(session({ secret: 'konfer', resave: false, saveUninitialized: false }));

app.get('/', (req, res) => res.redirect('/login.html'));

function onlyUser(req, res, next) {
  const user = req.session.user;
  if (user && user.role === 'user') return next();
  res.status(401).json({ error: 'Нужно войти в систему' });
}

function onlyAdmin(req, res, next) {
  const user = req.session.user;
  if (user && user.role === 'admin') return next();
  res.status(401).json({ error: 'Нужно войти как администратор' });
}

const LOGIN_RULE = /^[A-Za-z0-9]+$/;
const FULL_NAME_RULE = /^[А-Яа-яЁё ]+$/;
const PHONE_RULE = /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
const EMAIL_RULE = /^\S+@\S+\.\S+$/;

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

app.post('/api/register', async (req, res) => {
  const { login = '', password = '', fullName = '', phone = '', email = '' } = req.body;
  const errors = {};

  if (login.length < 6 || !LOGIN_RULE.test(login)) {
    errors.login = 'Логин: латинские буквы и цифры, не меньше 6 символов';
  } else if (await User.findByLogin(login)) {
    errors.login = 'Такой логин уже занят';
  }

  if (password.length < 8) {
    errors.password = 'Пароль должен быть не короче 8 символов';
  }

  if (!FULL_NAME_RULE.test(fullName)) {
    errors.fullName = 'ФИО: только русские буквы и пробелы';
  }

  if (!PHONE_RULE.test(phone)) {
    errors.phone = 'Телефон в формате 8(XXX)XXX-XX-XX';
  }

  if (!EMAIL_RULE.test(email)) {
    errors.email = 'Почта в формате name@example.ru';
  }

  if (hasErrors(errors)) {
    return res.status(400).json({ errors });
  }

  await User.create({ login, password, fullName: fullName.trim(), phone, email });
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { login = '', password = '' } = req.body;
  const errors = {};

  if (!login) {
    errors.login = 'Введите логин';
  }

  if (!password) {
    errors.password = 'Введите пароль';
  }

  if (hasErrors(errors)) {
    return res.status(400).json({ errors });
  }

  const user = await User.findByLogin(login);
  if (!user || !(await User.checkPassword(user, password))) {
    return res.status(400).json({ errors: { common: 'Неверный логин или пароль' } });
  }

  req.session.user = { id: user.id, role: user.role };
  res.json({ role: user.role });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

app.get('/api/rooms', async (req, res) => {
  res.json(await Room.all());
});

app.get('/api/requests', onlyUser, async (req, res) => {
  res.json(await Request.findByUser(req.session.user.id));
});

app.post('/api/requests', onlyUser, async (req, res) => {
  const { startAt = '', payment = '' } = req.body;
  const roomId = Number(req.body.roomId);
  const rooms = await Room.all();

  const start = new Date(startAt);
  const errors = {};

  if (!rooms.some((room) => room.id === roomId)) {
    errors.roomId = 'Выберите помещение';
  }

  if (!startAt || isNaN(start)) {
    errors.startAt = 'Укажите дату и время начала';
  } else if (start <= new Date()) {
    errors.startAt = 'Дата начала должна быть в будущем';
  }

  if (!Request.PAYMENTS.includes(payment)) {
    errors.payment = 'Выберите способ оплаты';
  }

  if (hasErrors(errors)) {
    return res.status(400).json({ errors });
  }

  await Request.create({ userId: req.session.user.id, roomId, startAt: start, payment });
  res.json({ ok: true });
});

app.post('/api/requests/:id/review', onlyUser, async (req, res) => {
  const { text = '' } = req.body;
  const rating = Number(req.body.rating);
  const request = await Request.findById(Number(req.params.id));

  const isOwn = request && request.user_id === req.session.user.id;
  const canReview = isOwn && request.status === 'Завершено' && !request.review_rating;

  if (!canReview) {
    return res.status(400).json({ errors: { text: 'Отзыв можно оставить только после завершения мероприятия' } });
  }

  const errors = {};

  if (isNaN(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Поставьте оценку';
  }

  if (text.trim().length < 10) {
    errors.text = 'Напишите не меньше 10 символов';
  }

  if (hasErrors(errors)) {
    return res.status(400).json({ errors });
  }

  await Review.create(request.id, rating, text.trim());
  res.json({ ok: true });
});

app.get('/api/admin/requests', onlyAdmin, async (req, res) => {
  const status = Request.STATUSES.includes(req.query.status) ? req.query.status : '';
  const roomId = Number(req.query.room) || 0;
  res.json(await Request.findAll(status, roomId));
});

app.post('/api/admin/requests/:id/status', onlyAdmin, async (req, res) => {
  const request = await Request.findById(Number(req.params.id));
  const { status } = req.body;
  const newStatuses = ['Мероприятие назначено', 'Завершено'];

  if (!request || request.status === 'Завершено' || !newStatuses.includes(status)) {
    return res.status(400).json({ error: 'Статус этой заявки нельзя изменить' });
  }

  await Request.setStatus(request.id, status);
  res.json({ ok: true });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Ошибка сервера. Проверьте, что база данных запущена, а пароль в models.js указан верно' });
});

app.listen(PORT, () => console.log(`Сайт запущен: http://localhost:${PORT}`));

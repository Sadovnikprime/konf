const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const db = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'konferencii_rf',
});

class User {
  static async findByLogin(login) {
    const result = await db.query('SELECT * FROM users WHERE login = $1', [login]);
    return result.rows[0];
  }

  static async create(data) {
    const hash = await bcrypt.hash(data.password, 10);
    await db.query(
      'INSERT INTO users (login, password, full_name, phone, email) VALUES ($1, $2, $3, $4, $5)',
      [data.login, hash, data.fullName, data.phone, data.email]
    );
  }

  static checkPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
}

class Room {
  static async all() {
    const result = await db.query('SELECT * FROM rooms ORDER BY id');
    return result.rows;
  }
}

const SELECT_REQUEST = `
  SELECT rq.id, rq.user_id, rq.payment, rq.status,
         to_char(rq.start_at, 'DD.MM.YYYY HH24:MI') AS start_at,
         r.name AS room_name, r.image AS room_image,
         u.full_name AS user_name, u.phone AS user_phone, u.email AS user_email,
         rv.rating AS review_rating, rv.text AS review_text
    FROM requests rq
    JOIN rooms r ON r.id = rq.room_id
    JOIN users u ON u.id = rq.user_id
    LEFT JOIN reviews rv ON rv.request_id = rq.id`;

class Request {
  static PAYMENTS = ['При очном посещении', 'Переводом по СБП'];
  static STATUSES = ['Новая', 'Мероприятие назначено', 'Завершено'];

  static async create(data) {
    await db.query(
      'INSERT INTO requests (user_id, room_id, start_at, payment) VALUES ($1, $2, $3, $4)',
      [data.userId, data.roomId, data.startAt, data.payment]
    );
  }

  static async findById(id) {
    const result = await db.query(SELECT_REQUEST + ' WHERE rq.id = $1', [id]);
    return result.rows[0];
  }

  static async findByUser(userId) {
    const result = await db.query(SELECT_REQUEST + ' WHERE rq.user_id = $1 ORDER BY rq.id DESC', [userId]);
    return result.rows;
  }

  static async findAll(status, roomId) {
    const result = await db.query(
      SELECT_REQUEST + ` WHERE ($1 = '' OR rq.status = $1) AND ($2 = 0 OR rq.room_id = $2) ORDER BY rq.id DESC`,
      [status, roomId]
    );
    return result.rows;
  }

  static async setStatus(id, status) {
    await db.query('UPDATE requests SET status = $1 WHERE id = $2', [status, id]);
  }
}

class Review {
  static async create(requestId, rating, text) {
    await db.query('INSERT INTO reviews (request_id, rating, text) VALUES ($1, $2, $3)', [requestId, rating, text]);
  }
}

module.exports = { User, Room, Request, Review };

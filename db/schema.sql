DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id        SERIAL       PRIMARY KEY,
    login     VARCHAR(50)  NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone     VARCHAR(15)  NOT NULL,
    email     VARCHAR(120) NOT NULL,
    role      VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

CREATE TABLE rooms (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    capacity    INTEGER      NOT NULL,
    description VARCHAR(255) NOT NULL,
    image       VARCHAR(50)  NOT NULL
);

CREATE TABLE bookings (
    id       SERIAL      PRIMARY KEY,
    user_id  INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    room_id  INTEGER     NOT NULL REFERENCES rooms (id),
    start_at TIMESTAMP   NOT NULL,
    payment  VARCHAR(30) NOT NULL CHECK (payment IN ('При очном посещении', 'Переводом по СБП')),
    status   VARCHAR(30) NOT NULL DEFAULT 'Новая' CHECK (status IN ('Новая', 'Мероприятие назначено', 'Завершено'))
);

CREATE TABLE reviews (
    id         SERIAL   PRIMARY KEY,
    booking_id INTEGER  NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
    rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text       TEXT     NOT NULL
);

CREATE INDEX bookings_user_idx ON bookings (user_id);
CREATE INDEX bookings_status_idx ON bookings (status);

INSERT INTO rooms (name, capacity, description, image) VALUES
    ('Аудитория', 120, 'Ряды амфитеатром, кафедра и проектор. Для докладов и пленарных заседаний.', 'auditorium.svg'),
    ('Коворкинг', 40, 'Столы для команд и переговорная. Для секций, мастер-классов и круглых столов.', 'coworking.svg'),
    ('Кинозал', 200, 'Большой экран и мягкие кресла. Для показов, презентаций и церемоний.', 'cinema.svg');

INSERT INTO users (login, password, full_name, phone, email, role) VALUES
    ('Conf2027', '$2b$10$qSLQebjohfGNd2NZsfDjtuN9T9SJZOwJ6fZDIjET1iS0GGhz9eUtG',
     'Администратор', '8(800)555-35-35', 'admin@conf.local', 'admin');

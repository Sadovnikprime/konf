// Общие функции для всех страниц сайта

// Отправляет запрос на сервер и возвращает его ответ.
// Пример: const rooms = await api('GET', '/api/rooms');
async function api(method, url, data) {
  const response = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });

  const result = await response.json();

  // Код 401: пользователь не вошёл в систему — отправляем его на страницу входа.
  // Код 500: ошибка на сервере — показываем её текст
  if (response.status === 401) location.href = '/login.html';
  if (response.status === 500) alert(result.error);
  if (response.status === 401 || response.status === 500) {
    await new Promise(() => {}); // останавливаемся здесь: дальше странице работать не с чем
  }

  return result;
}

// Показывает ошибки под полями формы.
// errors — объект от сервера: { login: 'текст ошибки', phone: 'текст ошибки' }.
// Класс is-invalid из Bootstrap делает рамку поля красной и показывает блок invalid-feedback
function showErrors(form, errors) {
  form.querySelectorAll('input, select, textarea').forEach((input) => {
    const text = errors[input.name] || '';
    input.classList.toggle('is-invalid', text !== '');
    input.parentElement.querySelector('.invalid-feedback').textContent = text;
  });
}

// Когда пользователь начинает исправлять поле, ошибка под ним убирается
document.addEventListener('input', (event) => {
  event.target.classList.remove('is-invalid');
});

// Показывает сообщение вверху страницы: «Статус изменён» и т. п.
function showMessage(text) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.hidden = false;
}

// Цвет метки статуса (классы Bootstrap)
function statusColor(status) {
  if (status === 'Мероприятие назначено') return 'text-bg-warning';
  if (status === 'Завершено') return 'text-bg-success';
  return 'text-bg-primary';
}

// Заменяет в тексте символы < > & и кавычки, чтобы текст, введённый пользователем,
// нельзя было превратить в HTML-код страницы
function safe(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

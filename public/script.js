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
// errors — объект от сервера: { login: 'текст ошибки', phone: 'текст ошибки' }
function showErrors(form, errors) {
  form.querySelectorAll('.field').forEach((field) => {
    const name = field.querySelector('input, select, textarea').name;
    const text = errors[name] || '';

    field.querySelector('.error').textContent = text;
    field.classList.toggle('invalid', text !== '');
  });
}

// Когда пользователь начинает исправлять поле, ошибка под ним убирается
document.addEventListener('input', (event) => {
  const field = event.target.closest('.field');
  if (field) {
    field.querySelector('.error').textContent = '';
    field.classList.remove('invalid');
  }
});

// Показывает сообщение вверху страницы: «Статус изменён» и т. п.
function showMessage(text) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.hidden = false;
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

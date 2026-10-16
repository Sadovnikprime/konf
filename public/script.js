async function api(method, url, data) {
  const response = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();

  if (response.status === 401) location.href = '/login.html';
  if (response.status === 500) alert(result.error);
  if (response.status === 401 || response.status === 500) await new Promise(() => {});

  return result;
}

function showErrors(form, errors) {
  form.querySelectorAll('input, select, textarea').forEach((input) => {
    const text = errors[input.name] || '';
    input.classList.toggle('is-invalid', text !== '');
    input.parentElement.querySelector('.invalid-feedback').textContent = text;
  });
}

document.addEventListener('input', (event) => {
  event.target.classList.remove('is-invalid');
});

function showMessage(text) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.hidden = false;
}

function statusColor(status) {
  if (status === 'Мероприятие назначено') return 'text-bg-warning';
  if (status === 'Завершено') return 'text-bg-success';
  return 'text-bg-primary';
}

function safe(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

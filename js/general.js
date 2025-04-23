const token = localStorage.getItem('token');
const params = new URLSearchParams(window.location.search);
const tableId = params.get('id');

if (!tableId) {
  alert('Missing table ID. Returning to events page...');
  window.location.href = 'event.html';
}

function addContactRow(contact = {}) {
  const container = document.getElementById('contactRows');
  const row = document.createElement('div');
  row.className = 'contact-row';
  row.innerHTML = `
    <input name="contactName" placeholder="Name" value="${contact.name || ''}" />
    <input name="contactNumber" placeholder="Number" value="${contact.number || ''}" />
    <input name="contactEmail" placeholder="E-Mail Address" value="${contact.email || ''}" />
    <input name="contactRole" placeholder="Role" value="${contact.role || ''}" />
    <button type="button" onclick="this.parentElement.remove()" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:6px 10px; cursor:pointer;">🗑</button>
  `;
  container.appendChild(row);
}

async function loadGeneralInfo() {
  const res = await fetch(`${API_BASE}/api/tables/${tableId}/general`, {
    headers: { Authorization: token }
  });
  const data = await res.json();

  const form = document.getElementById('generalForm');
  form.location.value = data.location || '';
  form.weather.value = data.weather || '';
  form.start.value = data.start || '';
  form.end.value = data.end || '';
  form.attendees.value = data.attendees || '';
  form.budget.value = data.budget || '';

  (data.contacts || []).forEach(contact => addContactRow(contact));
}

async function saveGeneralInfo() {
  const form = document.getElementById('generalForm');
  const contacts = Array.from(document.querySelectorAll('#contactRows .contact-row')).map(row => {
    const fields = row.querySelectorAll('input');
    return {
      name: fields[0].value,
      number: fields[1].value,
      email: fields[2].value,
      role: fields[3].value
    };
  });

  const general = {
    location: form.location.value,
    weather: form.weather.value,
    start: form.start.value,
    end: form.end.value,
    attendees: parseInt(form.attendees.value) || 0,
    budget: form.budget.value,
    contacts
  };

  await fetch(`${API_BASE}/api/tables/${tableId}/general`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify(general)
  });

  alert('General information saved!');
}

loadGeneralInfo();

function goBack() {
  const params = new URLSearchParams(window.location.search);
  const tableId = params.get('id');
  window.location.href = `event.html?id=${tableId}`;
}

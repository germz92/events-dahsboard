const token = localStorage.getItem('token');
const params = new URLSearchParams(window.location.search);
const tableId = params.get('id');

if (!tableId) {
  alert('Missing table ID. Returning to events page...');
  window.location.href = 'event.html';
}

function addContactRow(contact = {}) {
  const container = document.getElementById('contactRows');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input name="contactName" placeholder="Name" value="${contact.name || ''}" /></td>
    <td><input name="contactNumber" placeholder="Number" value="${contact.number || ''}" /></td>
    <td><input name="contactEmail" placeholder="E-Mail Address" value="${contact.email || ''}" /></td>
    <td><input name="contactRole" placeholder="Role" value="${contact.role || ''}" /></td>
    <td><button type="button" class="delete-btn" onclick="this.closest('tr').remove()">🗑</button></td>
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
  const container = document.getElementById('contactRows');
  const allRows = container.querySelectorAll('tr');

  const contacts = Array.from(allRows).map(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs.length === 0) {
      // Read-only row
      const cells = row.querySelectorAll('td');
      return {
        name: cells[0]?.textContent.trim(),
        number: cells[1]?.textContent.trim(),
        email: cells[2]?.textContent.trim(),
        role: cells[3]?.textContent.trim()
      };
    } else {
      // Editable input row
      return {
        name: inputs[0].value,
        number: inputs[1].value,
        email: inputs[2].value,
        role: inputs[3].value
      };
    }
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

const params = new URLSearchParams(window.location.search);
const tableId = params.get('id');
const token = localStorage.getItem('token');
let tableData = null;

function goBack() {
  const params = new URLSearchParams(window.location.search);
  const tableId = params.get('id');
  window.location.href = `event.html?id=${tableId}`;
}

function calculateHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startDate = new Date(0, 0, 0, sh, sm);
  const endDate = new Date(0, 0, 0, eh, em);
  const diff = (endDate - startDate) / (1000 * 60 * 60);
  return Math.max(diff.toFixed(2), 0);
}

async function loadTable() {
  const res = await fetch(`${API_BASE}/api/tables/${tableId}`, {
    headers: { Authorization: token }
  });
  tableData = await res.json();
  document.getElementById('tableTitle').textContent = tableData.title;
  renderTableSection();
}

function renderTableSection() {
  const container = document.getElementById('dateSections');
  container.innerHTML = '';

  const dates = [...new Set(tableData.rows.map(row => row.date))];
  dates.forEach(date => {
    const sectionBox = document.createElement('div');
    sectionBox.className = 'date-section';

    const header = document.createElement('h2');
    header.textContent = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Role</th>
        <th>Name</th>
        <th>Start</th>
        <th>End</th>
        <th>Total Hours</th>
        <th>Notes</th>
        <th>Action</th>
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tableData.rows
      .filter(row => row.date === date && row.role)
      .forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.role}</td>
          <td>${row.name}</td>
          <td>${row.startTime}</td>
          <td>${row.endTime}</td>
          <td>${row.totalHours}</td>
          <td>${row.notes}</td>
          <td><button onclick="deleteRow('${date}', ${index}')">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });

    const actionRow = document.createElement('tr');
    const actionTd = document.createElement('td');
    actionTd.colSpan = 7;
    const addBtn = document.createElement('button');
    addBtn.className = 'add-row-btn';
    addBtn.textContent = 'Add Row';
    addBtn.onclick = () => showRowInputs(date, tbody);
    actionTd.appendChild(addBtn);
    actionRow.appendChild(actionTd);
    tbody.appendChild(actionRow);

    table.appendChild(tbody);
    wrapper.appendChild(table);

    sectionBox.appendChild(header);
    sectionBox.appendChild(wrapper);
    container.appendChild(sectionBox);
  });
}


function showRowInputs(date, tbody) {
  const inputRow = document.createElement('tr');
  inputRow.innerHTML = `
    <td><select id='role-${date}'>
      <option value="">Select Role</option>
      <option value="Lead Photographer">Lead Photographer</option>
      <option value="Additional Photographer">Additional Photographer</option>
      <option value="Lead Videographer">Lead Videographer</option>
      <option value="Additional Videographer">Additional Videographer</option>
      <option value="Headshot Booth Photographer">Headshot Booth Photographer</option>
      <option value="Assistant">Assistant</option>
    </select></td>
    <td><select id='name-${date}' class='user-select'></select></td>
    <td><input type='time' step='900' id='start-${date}'></td>
    <td><input type='time' step='900' id='end-${date}'></td>
    <td><input id='hours-${date}' disabled></td>
    <td><input id='notes-${date}'></td>
    <td><button onclick="addRowToDate('${date}')">Save</button></td>
  `;
  tbody.insertBefore(inputRow, tbody.lastElementChild);
  populateUserDropdown();
}

async function addDateSection() {
  const date = document.getElementById('newDate').value;
  if (!date) return alert('Please select a date');

  const exists = tableData.rows.some(row => row.date === date);
  if (!exists) {
    tableData.rows.push({ date });
  }

  document.getElementById('newDate').value = '';
  renderTableSection();
}

async function addRowToDate(date) {
  const start = document.getElementById(`start-${date}`).value;
  const end = document.getElementById(`end-${date}`).value;
  const row = {
    date,
    role: document.getElementById(`role-${date}`).value,
    name: document.getElementById(`name-${date}`).value,
    startTime: start,
    endTime: end,
    totalHours: calculateHours(start, end),
    notes: document.getElementById(`notes-${date}`).value
  };

  await fetch(`${API_BASE}/api/tables/${tableId}/rows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify(row)
  });

  await loadTable();
}

async function populateUserDropdown() {
  const res = await fetch(`${API_BASE}/api/users`, {
    headers: { Authorization: token }
  });
  const users = await res.json();

  document.querySelectorAll('.user-select').forEach(select => {
    select.innerHTML = '<option value="">Select Name</option>';
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.username;
      option.textContent = user.username;
      select.appendChild(option);
    });
  });
}

async function deleteRow(date, index) {
  const rowsForDate = tableData.rows.filter(row => row.date === date);
  const globalIndex = tableData.rows.findIndex((row, i) => row === rowsForDate[index]);

  const res = await fetch(`${API_BASE}/api/tables/${tableId}/rows/${globalIndex}`, {
    method: 'DELETE',
    headers: { Authorization: token }
  });

  if (res.ok) {
    await loadTable();
  } else {
    alert('Failed to delete row');
  }
}

loadTable();

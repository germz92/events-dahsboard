const params = new URLSearchParams(window.location.search);
const tableId = params.get('id');
const token = localStorage.getItem('token');
let tableData = null;
let cachedUsers = [];

function goBack() {
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

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const adjustedHour = hour % 12 || 12;
  return `${adjustedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateLocal(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

async function loadTable() {
  const res = await fetch(`${API_BASE}/api/tables/${tableId}`, {
    headers: { Authorization: token }
  });
  tableData = await res.json();
  await preloadUsers();
  document.getElementById('tableTitle').textContent = tableData.title;
  renderTableSection();
}

async function preloadUsers() {
  const res = await fetch(`${API_BASE}/api/users`, {
    headers: { Authorization: token }
  });
  const users = await res.json();
  users.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  cachedUsers = users.map(u => u.fullName || u.email);
}

function renderTableSection() {
  const container = document.getElementById('dateSections');
  container.innerHTML = '';

  const dates = [...new Set(tableData.rows.map(row => row.date))];
  dates.forEach(date => {
    const sectionBox = document.createElement('div');
    sectionBox.className = 'date-section';

    const headerWrapper = document.createElement('div');
    headerWrapper.style.display = 'flex';
    headerWrapper.style.alignItems = 'center';
    headerWrapper.style.justifyContent = 'space-between';
    headerWrapper.style.marginBottom = '8px';

    const header = document.createElement('h2');
    header.textContent = formatDateLocal(date);

    const deleteDateBtn = document.createElement('button');
    deleteDateBtn.textContent = '🗑️';
    deleteDateBtn.style.background = 'transparent';
    deleteDateBtn.style.border = 'none';
    deleteDateBtn.style.cursor = 'pointer';
    deleteDateBtn.style.fontSize = '18px';
    deleteDateBtn.title = 'Delete Date';
    deleteDateBtn.onclick = () => deleteDate(date);

    headerWrapper.appendChild(header);
    headerWrapper.appendChild(deleteDateBtn);

    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    const table = document.createElement('table');
    table.style.tableLayout = 'fixed';
    table.style.width = '100%';
    table.innerHTML = `
      <colgroup>
        <col style="width: 17%;">
        <col style="width: 10%;">
        <col style="width: 10%;">
        <col style="width: 8%;">
        <col style="width: 20%;">
        <col style="width: 20%;">
        <col style="width: 15%;">
      </colgroup>
    `;

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Name</th>
        <th>Start</th>
        <th>End</th>
        <th>Total Hours</th>
        <th>Role</th>
        <th>Notes</th>
        <th>Action</th>
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tableData.rows
      .filter(row => row.date === date && row.role !== '__placeholder__')
      .forEach((row, index) => {
        const rowId = `row-${date}-${index}`;
        const tr = document.createElement('tr');
        tr.id = rowId;

        tr.innerHTML = `
          <td><span id="${rowId}-name">${row.name}</span></td>
          <td><span id="${rowId}-startTime">${formatTime(row.startTime)}</span></td>
          <td><span id="${rowId}-endTime">${formatTime(row.endTime)}</span></td>
          <td id="${rowId}-totalHours">${row.totalHours}</td>
          <td><span id="${rowId}-role">${row.role}</span></td>
          <td><span id="${rowId}-notes">${row.notes}</span></td>
          <td style="text-align: center;">
            <button onclick="toggleEdit('${date}', ${index}, true)">✏️</button>
            <button onclick="saveEdit('${date}', ${index})" style="display:none;">💾</button>
            <button onclick="deleteRow('${date}', ${index})" title="Delete" style="background: transparent; border: none; font-size: 18px; cursor: pointer;">🗑️</button>
          </td>
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
    sectionBox.appendChild(headerWrapper);
    sectionBox.appendChild(wrapper);
    container.appendChild(sectionBox);
  });
}


function toggleEdit(date, index, editing) {
  const prefix = `row-${date}-${index}`;
  const row = tableData.rows.filter(r => r.date === date)[index];

  if (editing) {
    document.getElementById(`${prefix}-name`).outerHTML =
      `<select id="${prefix}-name">${cachedUsers.map(u => `<option value="${u}" ${u === row.name ? 'selected' : ''}>${u}</option>`).join('')}</select>`;

    document.getElementById(`${prefix}-startTime`).outerHTML =
      `<input type="time" id="${prefix}-startTime" value="${row.startTime}">`;

    document.getElementById(`${prefix}-endTime`).outerHTML =
      `<input type="time" id="${prefix}-endTime" value="${row.endTime}">`;

    document.getElementById(`${prefix}-role`).outerHTML =
      `<select id="${prefix}-role">
        ${[
          "Lead Photographer", "Additional Photographer", "Lead Videographer",
          "Additional Videographer", "Headshot Booth Photographer", "Assistant"
        ].map(role => `<option value="${role}" ${role === row.role ? 'selected' : ''}>${role}</option>`).join('')}
      </select>`;

    document.getElementById(`${prefix}-notes`).outerHTML =
      `<input type="text" id="${prefix}-notes" value="${row.notes}">`;

    const totalHoursEl = document.getElementById(`${prefix}-totalHours`);
    document.getElementById(`${prefix}-startTime`).addEventListener('input', () => {
      totalHoursEl.textContent = calculateHours(
        document.getElementById(`${prefix}-startTime`).value,
        document.getElementById(`${prefix}-endTime`).value
      );
    });

    document.getElementById(`${prefix}-endTime`).addEventListener('input', () => {
      totalHoursEl.textContent = calculateHours(
        document.getElementById(`${prefix}-startTime`).value,
        document.getElementById(`${prefix}-endTime`).value
      );
    });
  }

  const actionCell = document.getElementById(`row-${date}-${index}`).querySelector('td:last-child');
  const [editBtn, saveBtn] = actionCell.querySelectorAll('button');
  editBtn.style.display = 'none';
  saveBtn.style.display = '';
}


async function saveEdit(date, index) {
  const prefix = `row-${date}-${index}`;
  const startTime = document.getElementById(`${prefix}-startTime`).value;
  const endTime = document.getElementById(`${prefix}-endTime`).value;
  const row = {
    name: document.getElementById(`${prefix}-name`).value,
    startTime,
    endTime,
    totalHours: calculateHours(startTime, endTime),
    role: document.getElementById(`${prefix}-role`).value,
    notes: document.getElementById(`${prefix}-notes`).value,
    date
  };

  const currentRow = tableData.rows.filter(r => r.date === date)[index];
  const globalIndex = tableData.rows.findIndex(r => r === currentRow);

  await fetch(`${API_BASE}/api/tables/${tableId}/rows/${globalIndex}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify(row)
  });

  await loadTable(); // Will render the table again using plain spans
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

async function deleteDate(date) {
  if (!confirm('Delete this entire day?')) return;

  tableData.rows = tableData.rows.filter(row => row.date !== date);

  await fetch(`${API_BASE}/api/tables/${tableId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify({ rows: tableData.rows })
  });

  await loadTable();
}

function showRowInputs(date, tbody) {
  const inputRow = document.createElement('tr');
  inputRow.innerHTML = `
    <td><select id='name-${date}' class='user-select'>
      ${cachedUsers.map(u => `<option value="${u}">${u}</option>`).join('')}
    </select></td>
    <td><input type='time' step='900' id='start-${date}'></td>
    <td><input type='time' step='900' id='end-${date}'></td>
    <td><input id='hours-${date}' disabled></td>
    <td><select id='role-${date}'>
      <option value="">Select Role</option>
      <option value="Lead Photographer">Lead Photographer</option>
      <option value="Additional Photographer">Additional Photographer</option>
      <option value="Lead Videographer">Lead Videographer</option>
      <option value="Additional Videographer">Additional Videographer</option>
      <option value="Headshot Booth Photographer">Headshot Booth Photographer</option>
      <option value="Assistant">Assistant</option>
    </select></td>
    <td><input id='notes-${date}'></td>
    <td><button onclick="addRowToDate('${date}')">Save</button></td>
  `;
  tbody.insertBefore(inputRow, tbody.lastElementChild);
}

async function addDateSection() {
  const date = document.getElementById('newDate').value;
  if (!date) return alert('Please select a date');

  const exists = tableData.rows.some(row => row.date === date);
  if (exists) {
    alert('This date already exists.');
    return;
  }

  const newRow = {
    date,
    role: '__placeholder__',
    name: '',
    startTime: '',
    endTime: '',
    totalHours: 0,
    notes: ''
  };

  await fetch(`${API_BASE}/api/tables/${tableId}/rows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify(newRow)
  });

  document.getElementById('newDate').value = '';
  await loadTable();

  const lastSection = document.querySelectorAll('.date-section');
  const section = lastSection[lastSection.length - 1];
  const tbody = section.querySelector('tbody');
  showRowInputs(date, tbody);
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

loadTable();

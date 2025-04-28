const params = new URLSearchParams(window.location.search);
const tableId = params.get('id');
const token = localStorage.getItem('token');
let tableData = null;

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
  const adjustedHour = hour % 12 || 12; // 0 → 12
  return `${adjustedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
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

    const headerWrapper = document.createElement('div');
    headerWrapper.style.display = 'flex';
    headerWrapper.style.alignItems = 'center';
    headerWrapper.style.justifyContent = 'space-between';
    headerWrapper.style.marginBottom = '8px';

    const header = document.createElement('h2');
    header.textContent = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

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
        <col style="width: 24%;"> <!-- Name -->
        <col style="width: 10%;"> <!-- Start -->
        <col style="width: 10%;"> <!-- End -->
        <col style="width: 10%;">  <!-- Total Hours -->
        <col style="width: 20%;"> <!-- Role -->
        <col style="width: 20%;"> <!-- Notes -->
        <col style="width: 6%;">  <!-- Action -->
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
      .filter(row => row.date === date && row.role)
      .forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.name}</td>
          <td>${formatTime(row.startTime)}</td>
          <td>${formatTime(row.endTime)}</td>
          <td>${row.totalHours}</td>
          <td>${row.role}</td>
          <td>${row.notes}</td>
          <td style="text-align: center;"><button onclick="deleteRow('${date}', ${index})" title="Delete" style="background: transparent; border: none; font-size: 18px; cursor: pointer;">🗑️</button></td>
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

function showRowInputs(date, tbody) {
  const inputRow = document.createElement('tr');
  inputRow.innerHTML = `
    <td><select id='name-${date}' class='user-select'>
      <option value="">Select Name</option>
      <option value="__new__">+ Add New Name</option>
    </select></td>
    <td><input type='time' step='900' id='start-${date}'></td>
    <td><input type='time' step='900' id='end-${date}'></td>
    <td><input id='hours-${date}' disabled></td>
    <td><select id='role-${date}' class='role-select'>
      <option value="">Select Role</option>
      <option value="Lead Photographer">Lead Photographer</option>
      <option value="Additional Photographer">Additional Photographer</option>
      <option value="Lead Videographer">Lead Videographer</option>
      <option value="Additional Videographer">Additional Videographer</option>
      <option value="Headshot Booth Photographer">Headshot Booth Photographer</option>
      <option value="Assistant">Assistant</option>
      <option value="__new__">+ Add New Role</option>
    </select></td>
    <td><input id='notes-${date}'></td>
    <td><button onclick="addRowToDate('${date}')">Save</button></td>
  `;
  tbody.insertBefore(inputRow, tbody.lastElementChild);
  
  populateUserDropdown(); // ⬅️ also sets up new name adding
  setupRoleDropdown();    // ⬅️ set up new role adding
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

async function populateUserDropdown() {
  const res = await fetch(`${API_BASE}/api/users`, {
    headers: { Authorization: token }
  });
  const users = await res.json();

  users.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

  document.querySelectorAll('.user-select').forEach(select => {
    const currentValue = select.value;
    select.innerHTML = `
      <option value="">Select Name</option>
      <option value="__new__">+ Add New Name</option>
    `;
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.fullName || user.email;
      option.textContent = user.fullName || user.email;
      select.appendChild(option);
    });
    select.value = currentValue;

    select.addEventListener('change', (e) => {
      if (e.target.value === '__new__') {
        const newName = prompt('Enter new name:');
        if (newName) {
          const option = document.createElement('option');
          option.value = newName;
          option.textContent = newName;
          select.appendChild(option);
          select.value = newName;
        } else {
          select.value = '';
        }
      }
    }, { once: true });
  });
}

function setupRoleDropdown() {
  document.querySelectorAll('.role-select').forEach(select => {
    select.addEventListener('change', (e) => {
      if (e.target.value === '__new__') {
        const newRole = prompt('Enter new role:');
        if (newRole) {
          const option = document.createElement('option');
          option.value = newRole;
          option.textContent = newRole;
          select.appendChild(option);
          select.value = newRole;
        } else {
          select.value = '';
        }
      }
    }, { once: true });
  });
}

loadTable();

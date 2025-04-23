const token = localStorage.getItem('token');
if (!token) {
  alert('Not logged in');
  window.location.href = 'login.html';
}

async function createTable() {
  const res = await fetch('http://localhost:3000/api/tables', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify({ title: document.getElementById('tableTitle').value })
  });
  await res.json();
  loadTables();
}

async function loadTables() {
  const res = await fetch('http://localhost:3000/api/tables', {
    headers: { Authorization: token }
  });
  const tables = await res.json();
  const list = document.getElementById('tableList');
  list.innerHTML = '';
  tables.forEach(table => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = 'Open';
    btn.onclick = () => window.location.href = `event.html?id=${table._id}`;
    li.textContent = table.title + ' ';
    li.appendChild(btn);
    list.appendChild(li);
  });
}

loadTables();

async function register() {
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const fullName = document.getElementById('regFullName').value.trim(); // 🔥 renamed
  const password = document.getElementById('regPassword').value.trim();

  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, fullName, password }) // 🔥 send fullName
  });

  const data = await res.json();
  alert(data.message || JSON.stringify(data));

  if (data.message === 'User created') {
    window.location.href = 'login.html';
  }
}

async function login() {
  const email = document.getElementById('email').value.trim().toLowerCase(); // 🔥 Lowercase
  const password = document.getElementById('password').value.trim();

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('fullName', data.fullName); // ✅ Use fullName
    window.location.href = 'events.html';
  }   else {
    alert(data.error || 'Login failed');
  }
}

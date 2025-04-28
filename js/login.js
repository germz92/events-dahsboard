// ✅ Full login.js (Updated)

// REGISTER
window.register = async function() {
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const fullName = document.getElementById('regFullName').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!email || !fullName || !password) {
    alert('Please fill out all fields.');
    return;
  }

  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, fullName, password })
  });

  const data = await res.json();
  alert(data.message || JSON.stringify(data));

  if (data.message === 'User created') {
    window.location.href = 'index.html'; // ✅ After registering, go to login page
  }
}

// LOGIN
window.login = async function() {
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  // Optional: show "Logging in..." while waiting
  const loginBtn = document.getElementById('loginButton');
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
  }

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('fullName', data.fullName); // ✅ Store fullName
    window.location.href = 'events.html';
  } else {
    alert(data.error || 'Login failed');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  }
}

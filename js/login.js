async function register() {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('regEmail').value,
      username: document.getElementById('regUsername').value,
      password: document.getElementById('regPassword').value
    })
  });
  const data = await res.json();
  alert(data.message || JSON.stringify(data));
  if (data.message === 'User created') {
    window.location.href = 'login.html';
  }
}

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username); // store username
    
    window.location.href = 'events.html';
  } else {
    alert(data.error || 'Login failed');
  }
}

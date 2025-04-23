async function register() {
  const res = await fetch('http://localhost:3000/api/auth/register', {
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

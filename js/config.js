(async function checkLogin() {
    console.log('[config.js] Running checkLogin...');
  
    const pathname = window.location.pathname.toLowerCase();
    const isLoginPage =
      pathname.endsWith('/index.html') ||
      pathname === '/' ||
      pathname === '' ||
      window.location.href.toLowerCase().endsWith('/');
  
    if (isLoginPage) {
      console.log('[config.js] Skipping login check on login page');
      return;
    }
  
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[config.js] No token found, redirecting...');
      window.location.href = 'index.html';
      return;
    }
  
    try {
      const res = await fetch(`${API_BASE}/api/verify-token`, {
        headers: { Authorization: token }
      });
  
      const data = await res.json();
      console.log('[config.js] verify-token status:', res.status);
      console.log('[config.js] verify-token response:', data);
  
      if (!res.ok || !data.valid) {
        console.warn('[config.js] Invalid token. Logging out...');
        localStorage.clear();
        window.location.href = 'index.html';
      }
    } catch (err) {
      console.error('[config.js] Auth check failed:', err);
      window.location.href = 'index.html';
    }
  })();
  
// checkAuth_admin.js — Khusus untuk halaman ADMIN
// Penggunaan di halaman admin:
// <script src="https://login.lidan.co.id/checkAuth_admin.js"></script>
// <script> checkAuth(); </script>

console.log('%c checkAuth_admin.js v1.0 — loaded ✓', 'background:#c8a96e;color:#000;padding:3px 8px;border-radius:4px;font-weight:bold;');

// ─── KONFIGURASI ─────────────────────────────────────
const AUTH_CONFIG = {
  API_URL    : 'https://lidan-co-id.pages.dev/api/contacts_filter_dinamis7',
  API_SECRET : 'admin',                                          // ← ganti
  LOGIN_PAGE : 'https://login.lidan.co.id/login_admin.html',    // ← selalu admin
};
// ─────────────────────────────────────────────────────

async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  const role  = localStorage.getItem('auth_role');
  const user  = localStorage.getItem('auth_user');

  // 1. Cek localStorage ada tidak
  if (!token || !role || !user) {
    redirectToLogin();
    return;
  }

  // 2. Wajib role admin
  if (role !== 'admin') {
    redirectToLogin('Akses ditolak. Halaman ini khusus admin.');
    return;
  }

  // 3. Berhasil → return data user
  return JSON.parse(user);
}

function redirectToLogin(message = null) {
  if (message) localStorage.setItem('auth_redirect_msg', message);
  localStorage.setItem('auth_redirect_back', window.location.href);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_user');
  window.location.href = AUTH_CONFIG.LOGIN_PAGE;
}

function logout() {
  // Bersihkan localStorage di domain halaman ini dulu
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_redirect_back');
  localStorage.removeItem('auth_redirect_msg');
  // Baru redirect ke halaman login
  window.location.href = AUTH_CONFIG.LOGIN_PAGE;
}

function getAuthUser() {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
}

function getAuthRole() {
  return localStorage.getItem('auth_role');
}
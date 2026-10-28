// Shared code for login and register pages

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showMsg(text, type) {
  document.getElementById("msg").innerHTML = `<div class="alert alert-${type} py-2">${text}</div>`;
}

// Mark a field red/green
function check(input, ok) {
  input.classList.toggle("is-invalid", !ok);
  input.classList.toggle("is-valid", ok);
  return ok;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return { ok: res.ok, data: await res.json() };
}

// Used by login.html and admin-login.html
function setupLogin(apiUrl, nextPage, options = {}) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const identifier = document.getElementById("identifier") || document.getElementById("email");
    const password = document.getElementById("password");

    const value = identifier.value.trim();
    const validIdentifier = EMAIL_RE.test(value) ||
      (options.allowPhone && /^[6-9][0-9]{9}$/.test(value));
    const v1 = check(identifier, validIdentifier);
    const v2 = check(password, password.value.length > 0);
    if (!(v1 && v2)) return;

    const { ok, data } = await postJSON(apiUrl, { identifier: value, password: password.value });
    if (!ok) return showMsg(data.error, "danger");
    window.location.href = nextPage;
  });
}

// Used by register.html
function setupRegister() {
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const password = document.getElementById("password");
    const confirm = document.getElementById("confirm");

    const checks = [
      check(name, /^[A-Za-z ]{3,30}$/.test(name.value.trim())),
      check(email, EMAIL_RE.test(email.value.trim())),
      check(phone, /^[6-9][0-9]{9}$/.test(phone.value.trim())),
      check(password, /^(?=.*[A-Za-z])(?=.*[0-9]).{6,}$/.test(password.value)),
      check(confirm, confirm.value !== "" && confirm.value === password.value)
    ];
    if (checks.includes(false)) return;

    const { ok, data } = await postJSON("/api/auth/register", {
      name: name.value, email: email.value, phone: phone.value, password: password.value
    });
    if (!ok) return showMsg(data.error, "danger");
    window.location.href = "/user.html";
  });
}

async function logout(to = "/login.html") {
  const isAdmin = to.includes("admin-login");
  const endpoint = isAdmin ? "/api/auth/admin-logout" : "/api/auth/logout";
  await fetch(endpoint, { method: "POST" });
  window.location.href = to;
}

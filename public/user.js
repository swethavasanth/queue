// User dashboard: book token, see my tokens, cancel

async function loadUser() {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return (window.location.href = "/login.html");
  const me = await res.json();
  document.getElementById("userName").textContent = me.name;
  document.getElementById("userContact").textContent = me.email || me.phone;
}

async function loadMyTokens() {
  const res = await fetch("/api/tokens/my");
  if (res.status === 401) return (window.location.href = "/login.html");
  const data = await res.json();

  document.getElementById("nowServing").textContent = data.nowServing ?? "--";
  document.getElementById("myTokens").innerHTML = data.tokens.length === 0
    ? `<p class="text-muted">You have not booked any token today.</p>`
    : data.tokens.map((t) => `
      <div class="border rounded p-3 mb-2 d-flex justify-content-between align-items-center">
        <div>
          <span class="fs-3 fw-bold text-primary">#${t.tokenNumber}</span>
          <span class="ms-2">Purpose: ${t.service}</span><br>
          <span class="badge badge-${t.status}">${t.status}</span>
          ${t.status === "Waiting" ? `<small class="ms-2">People ahead: <b>${t.peopleAhead}</b></small>` : ""}
          ${t.status === "Serving" ? `<small class="ms-2 text-primary fw-bold">Please go to the counter</small>` : ""}
        </div>
        ${t.status === "Waiting"
          ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelToken(${t.tokenNumber})">Cancel</button>` : ""}
      </div>`).join("");
}

document.getElementById("tokenForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const service = document.getElementById("service");
  if (!check(service, service.value !== "")) return;

  const { ok, data } = await postJSON("/api/tokens", { service: service.value });
  if (!ok) return showMsg(data.error, "danger");

  showMsg(`Token <b>#${data.tokenNumber}</b> booked for ${data.service}`, "success");
  e.target.reset();
  service.classList.remove("is-valid");
  loadMyTokens();
});

async function cancelToken(num) {
  if (!confirm("Cancel token #" + num + "?")) return;
  const res = await fetch(`/api/tokens/my/${num}/cancel`, { method: "PUT" });
  const data = await res.json();
  showMsg(data.message || data.error, res.ok ? "secondary" : "danger");
  loadMyTokens();
}

loadUser();
loadMyTokens();
setInterval(loadMyTokens, 5000); // auto-refresh every 5 seconds

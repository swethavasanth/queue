// Customer page: book token + check status

function showMsg(id, text, type) {
  document.getElementById(id).innerHTML = `<div class="alert alert-${type}">${text}</div>`;
}

// Mark a field red/green
function check(input, ok) {
  input.classList.toggle("is-invalid", !ok);
  input.classList.toggle("is-valid", ok);
  return ok;
}

// ---- Book token ----
document.getElementById("tokenForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name");
  const phone = document.getElementById("phone");
  const service = document.getElementById("service");

  // Client-side validation
  const v1 = check(name, /^[A-Za-z ]{3,30}$/.test(name.value.trim()));
  const v2 = check(phone, /^[6-9][0-9]{9}$/.test(phone.value.trim()));
  const v3 = check(service, service.value !== "");
  if (!(v1 && v2 && v3)) return;

  const res = await fetch("/api/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.value, phone: phone.value, service: service.value })
  });
  const data = await res.json();

  if (!res.ok) return showMsg("bookResult", data.error, "danger");

  document.getElementById("bookResult").innerHTML = `
    <div class="alert alert-success text-center">
      Your token number is<br><span class="big-number">${data.tokenNumber}</span><br>
      ${data.name} - ${data.service}
    </div>`;
  e.target.reset();
  [name, phone, service].forEach((i) => i.classList.remove("is-valid"));
});

// ---- Check status ----
document.getElementById("statusForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const num = document.getElementById("checkNumber").value;
  if (!num || num < 1) return showMsg("statusResult", "Enter a valid token number", "warning");

  const res = await fetch("/api/tokens/" + num);
  const data = await res.json();
  if (!res.ok) return showMsg("statusResult", data.error, "danger");

  const t = data.token;
  let cancelBtn = t.status === "Waiting"
    ? `<button class="btn btn-sm btn-outline-danger mt-2" onclick="cancelToken(${t.tokenNumber})">Cancel my token</button>` : "";

  document.getElementById("statusResult").innerHTML = `
    <div class="alert alert-info">
      <b>Token #${t.tokenNumber}</b> - ${t.name}<br>
      Status: <span class="badge badge-${t.status}">${t.status}</span><br>
      Now serving: <b>${data.nowServing ?? "None"}</b><br>
      ${t.status === "Waiting" ? `People ahead of you: <b>${data.peopleAhead}</b>` : ""}
      <br>${cancelBtn}
    </div>`;
});

async function cancelToken(num) {
  if (!confirm("Cancel token #" + num + "?")) return;
  const res = await fetch(`/api/tokens/${num}/cancel`, { method: "PUT" });
  const data = await res.json();
  showMsg("statusResult", data.message || data.error, res.ok ? "secondary" : "danger");
}

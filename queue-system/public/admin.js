// Admin page: view queue and call next token

async function loadQueue() {
  const res = await fetch("/api/tokens");
  const tokens = await res.json();

  const serving = tokens.find((t) => t.status === "Serving");
  document.getElementById("nowServing").textContent = serving ? serving.tokenNumber : "--";
  document.getElementById("cWaiting").textContent = tokens.filter((t) => t.status === "Waiting").length;
  document.getElementById("cCompleted").textContent = tokens.filter((t) => t.status === "Completed").length;
  document.getElementById("cTotal").textContent = tokens.length;

  document.getElementById("queueBody").innerHTML = tokens.length === 0
    ? `<tr><td colspan="6" class="text-center text-muted">No tokens yet today</td></tr>`
    : tokens.map((t) => `
      <tr>
        <td><b>#${t.tokenNumber}</b></td>
        <td>${t.name}</td>
        <td>${t.phone}</td>
        <td>${t.service}</td>
        <td><span class="badge badge-${t.status}">${t.status}</span></td>
        <td>${t.status === "Waiting"
          ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelToken(${t.tokenNumber})">Cancel</button>` : "-"}</td>
      </tr>`).join("");
}

async function callNext() {
  const res = await fetch("/api/tokens/next", { method: "PUT" });
  const data = await res.json();
  document.getElementById("adminMsg").textContent = data.message;
  loadQueue();
}

async function cancelToken(num) {
  if (!confirm("Cancel token #" + num + "?")) return;
  await fetch(`/api/tokens/${num}/cancel`, { method: "PUT" });
  loadQueue();
}

loadQueue();
setInterval(loadQueue, 5000); // auto-refresh every 5 seconds

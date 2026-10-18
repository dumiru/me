/* ==========================================================
   CLIENT PORTAL LOGIC
   Signs clients in using clients.json and shows the pause notice.
   ========================================================== */
(function () {
  const DATA_URL = "clients.json";

  const $ = (sel) => document.querySelector(sel);
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let db = null;
  let loadError = null;

  async function loadData() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      db = await res.json();
      document.title = `${db.settings?.portalTitle || "Client Portal"} | Dumiru Jayasekara`;
    } catch (err) {
      loadError = err;
      console.error("Could not load clients.json:", err);
    }
  }

  function findClient(username, password) {
    const u = username.trim().toLowerCase();
    return (db?.clients || []).find(c =>
      String(c.username).toLowerCase() === u && c.password === password
    ) || null;
  }

  function onLogin(e) {
    e.preventDefault();
    const errorEl = $("#loginError");
    errorEl.textContent = "";

    if (!db) {
      errorEl.textContent = loadError
        ? "Could not load client data. Open this page through a web server, with clients.json in the same folder."
        : "Loading, please try again in a moment.";
      return;
    }

    const client = findClient($("#username").value, $("#password").value);
    if (!client) {
      errorEl.textContent = "Incorrect username or password.";
      $("#password").value = "";
      return;
    }
    showPortal(client);
  }

  function showPortal(c) {
    $("#login").classList.add("hidden");
    $("#portal").classList.remove("hidden");
    $("#greeting").innerHTML = `Hello, <span>${esc(c.firstName)}</span>`;
    $("#company").textContent = c.company || "";
    window.scrollTo(0, 0);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#loginForm").addEventListener("submit", onLogin);
    loadData();
  });
})();

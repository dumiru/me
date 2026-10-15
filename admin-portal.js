/* ==========================================================
   ADMIN PORTAL LOGIC
   Manages the accounts and content in clients.json.
   Changes are kept in this browser until you download clients.json
   and upload it to your host.
   ========================================================== */
(function () {
  /* ---------- ADMIN SIGN-IN: CHANGE THESE BEFORE GOING LIVE ----------
     Anyone who can open this file can read these details. */
  const ADMIN = { username: "admin", password: "admin123" };

  const DATA_URL = "clients.json";
  const DRAFT_KEY = "dumiru-clients-draft";
  const MILESTONE_STATES = [["todo", "To do"], ["now", "In progress"], ["done", "Done"]];
  const PROJECT_STATUSES = ["In progress", "Completed", "On hold"];

  const $ = (sel) => document.querySelector(sel);
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let db = null;          // full clients.json object
  let dirty = false;      // true when changes are not yet downloaded
  let mode = "none";      // "none" | "new" | "edit"
  let selected = -1;      // index of the client being edited
  let query = "";

  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2800);
  };

  /* ---------- Storage ---------- */
  function persist() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(db)); } catch (e) { console.warn(e); }
  }

  function setDirty(value) {
    dirty = value;
    $("#dirtyBadge").classList.toggle("hidden", !value);
    $("#storeNote").textContent = value
      ? "Unsaved changes are kept in this browser only. Download clients.json and upload it to your host to publish."
      : "Loaded from clients.json. No unpublished changes.";
    if (value) persist(); else localStorage.removeItem(DRAFT_KEY);
  }

  async function fetchServer() {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadStore() {
    if (db) return;
    try { db = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { db = null; }
    if (db) { setDirty(true); }
    else {
      try { db = await fetchServer(); setDirty(false); }
      catch (e) { console.error(e); toast("Could not load clients.json. Open this page through a web server."); }
    }
    if (db && !Array.isArray(db.clients)) db.clients = [];
  }

  /* ---------- Sign in / out ---------- */
  async function onLogin(e) {
    e.preventDefault();
    const ok = $("#username").value.trim() === ADMIN.username && $("#password").value === ADMIN.password;
    if (!ok) {
      $("#loginError").textContent = "Incorrect admin username or password.";
      $("#password").value = "";
      return;
    }
    $("#loginError").textContent = "";
    await loadStore();
    if (!db) { $("#loginError").textContent = "Client data could not be loaded."; return; }

    $("#login").classList.add("hidden");
    $("#dashboard").classList.remove("hidden");
    $("#logout").classList.remove("hidden");
    setDirty(dirty);
    renderList();
    showEmpty();
  }

  function signOut() {
    $("#dashboard").classList.add("hidden");
    $("#logout").classList.add("hidden");
    $("#login").classList.remove("hidden");
    $("#password").value = "";
  }

  /* ---------- List ---------- */
  function renderList() {
    const q = query.toLowerCase();
    const matches = db.clients
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => [c.username, c.fullName, c.company].some(v => String(v || "").toLowerCase().includes(q)));

    $("#count").textContent = `${db.clients.length} total`;
    $("#clientList").innerHTML = matches.map(({ c, i }) => `
      <button class="cl-item ${mode === "edit" && i === selected ? "active" : ""}" data-i="${i}">
        <b>${esc(c.fullName || c.firstName || c.username)}</b>
        <small>@${esc(c.username)} &middot; ${esc(c.company || "")}</small>
      </button>`).join("") || `<p class="muted">No clients found.</p>`;
  }

  function showEmpty() {
    mode = "none";
    selected = -1;
    $("#editor").innerHTML = `<div class="empty"><p class="muted">Select a client to edit, or add a new one.</p></div>`;
    renderList();
  }

  /* ---------- Editor ---------- */
  function genPassword(len = 10) {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const bytes = new Uint32Array(len);
    crypto.getRandomValues(bytes);
    return [...bytes].map(n => chars[n % chars.length]).join("");
  }

  function blankClient() {
    return {
      username: "", password: genPassword(), firstName: "", fullName: "", company: "",
      balanceDue: 0, nextDelivery: "", nextMeeting: {}, projects: [], milestones: []
    };
  }

  function openEditor(i) {
    const isNew = i === -1;
    const c = isNew ? blankClient() : db.clients[i];
    mode = isNew ? "new" : "edit";
    selected = i;
    $("#editor").innerHTML = editorHTML(c, isNew);
    renderList();
  }

  function field(label, id, value, type = "text", cls = "") {
    return `<div class="field ${cls}">
      <label for="f-${id}">${label}</label>
      <input id="f-${id}" type="${type}" value="${esc(value)}">
    </div>`;
  }

  function projectRow(p = {}) {
    return `<div class="row prow">
      <input class="pt" placeholder="Title" value="${esc(p.title)}">
      <input class="pd" placeholder="Description" value="${esc(p.desc)}">
      <input class="pp" type="number" min="0" max="100" placeholder="%" value="${esc(p.progress ?? 0)}">
      <select class="ps">${PROJECT_STATUSES.map(s => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      <input class="pdue" placeholder="Due date" value="${esc(p.due)}">
      <button type="button" class="icon" data-rm aria-label="Remove project">&times;</button>
    </div>`;
  }

  function milestoneRow(m = {}) {
    return `<div class="mrow msrow">
      <input class="mt" placeholder="Milestone" value="${esc(m.title)}">
      <input class="md" placeholder="Date or status" value="${esc(m.date)}">
      <select class="ms">${MILESTONE_STATES.map(([v, l]) => `<option value="${v}" ${v === m.state ? "selected" : ""}>${l}</option>`).join("")}</select>
      <button type="button" class="icon" data-rm aria-label="Remove milestone">&times;</button>
    </div>`;
  }

  function editorHTML(c, isNew) {
    const m = c.nextMeeting || {};
    return `
    <form id="clientForm" novalidate>
      <div class="ed-head">
        <span class="eyebrow">${isNew ? "New client" : "Editing client"}</span>
        <h2>${isNew ? "Create client account" : esc(c.fullName || c.firstName || c.username)}</h2>
      </div>

      <div class="section-h">Account</div>
      <div class="grid-f">
        ${field("Username", "username", c.username)}
        <div class="field">
          <label for="f-password">Password</label>
          <div class="pw-wrap">
            <input id="f-password" type="text" value="${esc(c.password)}">
            <button type="button" class="btn btn-ghost btn-sm" data-gen>Generate</button>
          </div>
          <div class="hint">Share this password with the client.</div>
        </div>
        ${field("First name", "firstName", c.firstName)}
        ${field("Full name", "fullName", c.fullName)}
        ${field("Company", "company", c.company, "text", "span2")}
        ${field("Balance due (LKR)", "balanceDue", c.balanceDue, "number")}
        ${field("Next delivery", "nextDelivery", c.nextDelivery)}
      </div>

      <div class="section-h">Next meeting</div>
      <div class="grid-f">
        ${field("Date", "mDate", m.date)}
        ${field("Time", "mTime", m.time)}
        <div class="field span2">
          <label for="f-mNote">Note</label>
          <textarea id="f-mNote" rows="2">${esc(m.note)}</textarea>
        </div>
      </div>

      <div class="section-h">
        <span>Projects</span>
        <button type="button" class="btn btn-ghost btn-sm" data-add="project">+ Add project</button>
      </div>
      <div id="projRows">${(c.projects || []).map(p => projectRow(p)).join("")}</div>

      <div class="section-h">
        <span>Milestones</span>
        <button type="button" class="btn btn-ghost btn-sm" data-add="milestone">+ Add milestone</button>
      </div>
      <div id="msRows">${(c.milestones || []).map(m => milestoneRow(m)).join("")}</div>

      <div class="form-error" id="formError" role="alert"></div>

      <div class="actions">
        ${isNew ? "<span></span>" : `<button type="button" class="btn btn-danger btn-sm" data-delete>Delete client</button>`}
        <div class="tools">
          <button type="button" class="btn btn-ghost btn-sm" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-orange btn-sm">${isNew ? "Create client" : "Save changes"}</button>
        </div>
      </div>
    </form>`;
  }

  // Read the form into a client object
  function collect() {
    const val = (id) => $("#f-" + id).value.trim();
    const projects = [...document.querySelectorAll("#projRows .prow")].map(r => ({
      title: r.querySelector(".pt").value.trim(),
      desc: r.querySelector(".pd").value.trim(),
      progress: Math.round(Number(r.querySelector(".pp").value) || 0),
      status: r.querySelector(".ps").value,
      due: r.querySelector(".pdue").value.trim()
    })).filter(p => p.title);

    const milestones = [...document.querySelectorAll("#msRows .msrow")].map(r => ({
      title: r.querySelector(".mt").value.trim(),
      date: r.querySelector(".md").value.trim(),
      state: r.querySelector(".ms").value
    })).filter(m => m.title);

    return {
      username: val("username"),
      password: $("#f-password").value,
      firstName: val("firstName"),
      fullName: val("fullName"),
      company: val("company"),
      balanceDue: Number(val("balanceDue")) || 0,
      nextDelivery: val("nextDelivery"),
      nextMeeting: { date: val("mDate"), time: val("mTime"), note: $("#f-mNote").value.trim() },
      projects,
      milestones
    };
  }

  function validateClient(o, ignoreIndex) {
    if (!/^[a-z0-9._-]{3,32}$/i.test(o.username))
      return "Username must be 3 to 32 characters: letters, numbers, dots, dashes or underscores.";
    if (db.clients.some((c, i) => i !== ignoreIndex && String(c.username).toLowerCase() === o.username.toLowerCase()))
      return "That username is already used by another client.";
    if (o.password.length < 4) return "Password must be at least 4 characters.";
    if (!o.firstName) return "First name is required.";
    if (o.projects.some(p => p.progress < 0 || p.progress > 100)) return "Project progress must be between 0 and 100.";
    return "";
  }

  function saveClient() {
    const o = collect();
    const err = validateClient(o, mode === "edit" ? selected : -1);
    $("#formError").textContent = err;
    if (err) return;

    if (mode === "new") {
      db.clients.push(o);
      selected = db.clients.length - 1;
    } else {
      db.clients[selected] = o;
    }
    setDirty(true);
    renderList();
    openEditor(selected);
    toast("Client saved. Download clients.json to publish.");
  }

  function deleteClient() {
    const c = db.clients[selected];
    if (!confirm(`Delete ${c.fullName || c.username}? This cannot be undone.`)) return;
    db.clients.splice(selected, 1);
    setDirty(true);
    showEmpty();
    toast("Client deleted.");
  }

  /* ---------- Download and replace clients.json ---------- */
  function download() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "clients.json" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDirty(false);
    toast("clients.json downloaded. Upload it to your host to publish.");
  }

  function validateDb(d) {
    if (!d || !Array.isArray(d.clients)) return 'The file needs a "clients" list.';
    const seen = new Set();
    for (const [i, c] of d.clients.entries()) {
      if (!c.username || !c.password) return `Client ${i + 1} needs a username and password.`;
      const u = String(c.username).toLowerCase();
      if (seen.has(u)) return `The username "${c.username}" is used more than once.`;
      seen.add(u);
    }
    d.settings = d.settings || { currency: "LKR", portalTitle: "Client Portal" };
    return "";
  }

  function importFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(reader.result); }
      catch { toast("That file is not valid JSON."); return; }
      const err = validateDb(data);
      if (err) { toast(err); return; }
      if (!confirm("Replace ALL client data with this file? Unpublished changes in this browser will be lost.")) return;
      db = data;
      setDirty(true);
      showEmpty();
      toast("clients.json replaced.");
    };
    reader.readAsText(file);
  }

  async function reloadFromServer() {
    if (!confirm("Discard unsaved changes and reload clients.json from the server?")) return;
    try {
      db = await fetchServer();
      setDirty(false);
      showEmpty();
      toast("Reloaded from the server.");
    } catch (e) {
      toast("Could not load clients.json.");
    }
  }

  /* ---------- Events ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    $("#loginForm").addEventListener("submit", onLogin);
    $("#logout").addEventListener("click", signOut);
    $("#newBtn").addEventListener("click", () => openEditor(-1));
    $("#downloadBtn").addEventListener("click", download);
    $("#importFile").addEventListener("change", importFile);
    $("#resetBtn").addEventListener("click", reloadFromServer);
    $("#search").addEventListener("input", e => { query = e.target.value; renderList(); });

    $("#clientList").addEventListener("click", e => {
      const btn = e.target.closest("[data-i]");
      if (btn) openEditor(Number(btn.dataset.i));
    });

    $("#editor").addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.hasAttribute("data-gen")) $("#f-password").value = genPassword();
      else if (t.dataset.add === "project") $("#projRows").insertAdjacentHTML("beforeend", projectRow());
      else if (t.dataset.add === "milestone") $("#msRows").insertAdjacentHTML("beforeend", milestoneRow());
      else if (t.hasAttribute("data-rm")) t.closest(".row, .mrow").remove();
      else if (t.hasAttribute("data-cancel")) { if (mode === "new") showEmpty(); else openEditor(selected); }
      else if (t.hasAttribute("data-delete")) deleteClient();
    });

    $("#editor").addEventListener("submit", e => {
      e.preventDefault();
      saveClient();
    });
  });
})();

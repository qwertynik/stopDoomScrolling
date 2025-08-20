(function(){
  // State
  let trackedSites = [];
  let messages = [];
  let blockTime = 20;
  let showTimer = true;
  let dirty = false;

  const $ = sel => document.querySelector(sel);
  const el = (tag, props={}, ...children) => {
    const n = document.createElement(tag);
    Object.assign(n, props);
    for (const c of children) {
      if (typeof c === "string") n.appendChild(document.createTextNode(c));
      else if (c) n.appendChild(c);
    }
    return n;
  };

  function setDirty(v=true) {
    dirty = v;
    const badge = $("#saveStatus");
    badge.textContent = dirty ? "Unsaved" : "Saved";
    badge.style.background = dirty ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)";
    badge.style.border = dirty ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(34,197,94,0.35)";
    badge.style.color = dirty ? "#fecaca" : "#bbf7d0";
  }

  function renderList(listEl, emptyEl, items, kind) {
    listEl.innerHTML = "";
    if (!items.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    items.forEach((val, idx) => {
      const valueEl = el("div", { className: "value" }, val);
      const editBtn = el("button", { className: "btn small" }, "Edit");
      const delBtn = el("button", { className: "btn small danger" }, "Delete");
      editBtn.addEventListener("click", () => {
        const next = prompt(`Edit ${kind}`, val);
        if (next === null) return;
        const trimmed = next.trim();
        if (!trimmed) return;
        items[idx] = trimmed;
        setDirty(true);
        render();
      });
      delBtn.addEventListener("click", () => {
        items.splice(idx,1);
        setDirty(true);
        render();
      });
      const row = el("div", { className: "item" }, valueEl, el("div", { className: "actions" }, editBtn, delBtn));
      listEl.appendChild(row);
    });
  }

  function render() {
    renderList($("#domainsList"), $("#domainsEmpty"), trackedSites, "domain");
    renderList($("#messagesList"), $("#messagesEmpty"), messages, "message");
    $("#blockTime").value = blockTime;
    $("#showTimer").checked = !!showTimer;
  }

  function load() {
    chrome.storage.sync.get(["trackedSites", "blockTime", "messages", "showTimer"], (data) => {
      trackedSites = Array.isArray(data.trackedSites) ? data.trackedSites : ["x.com","linkedin.com","instagram.com"];
      messages = Array.isArray(data.messages) ? data.messages : ["Do you really want to scroll further?"];
      blockTime = Number.isFinite(data.blockTime) ? data.blockTime : 20;
      showTimer = data.showTimer !== false;
      setDirty(false);
      render();
    });
  }

  function save() {
    const payload = {
      trackedSites: trackedSites.filter(Boolean),
      messages: messages.filter(Boolean),
      blockTime: Math.max(1, parseInt($("#blockTime").value,10) || 20),
      showTimer: $("#showTimer").checked
    };
    chrome.storage.sync.set(payload, () => {
      // Notify for immediate timer toggle effect
      chrome.runtime.sendMessage({ type: "toggleTimer", show: payload.showTimer });
      setDirty(false);
    });
  }

  // Add handlers
  $("#addDomainBtn").addEventListener("click", () => {
    const val = $("#domainInput").value.trim();
    if (!val) return;
    if (!trackedSites.includes(val)) trackedSites.push(val);
    $("#domainInput").value = "";
    setDirty(true);
    render();
  });

  $("#domainInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#addDomainBtn").click();
  });

  $("#addMessageBtn").addEventListener("click", () => {
    const val = $("#messageInput").value.trim();
    if (!val) return;
    messages.push(val);
    $("#messageInput").value = "";
    setDirty(true);
    render();
  });

  $("#messageInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#addMessageBtn").click();
  });

  $("#blockTime").addEventListener("input", () => setDirty(true));
  $("#showTimer").addEventListener("change", () => { setDirty(true); save(); }); // applies immediately

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset to default settings?")) return;
    trackedSites = ["x.com","linkedin.com","instagram.com"];
    messages = ["Do you really want to scroll further?"];
    blockTime = 20;
    showTimer = true;
    save();
    render();
  });

  $("#saveBtn").addEventListener("click", save);

  load();
})();

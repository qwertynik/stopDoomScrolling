
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["trackedSites", "blockTime", "messages", "showTimer"], (data) => {
    document.getElementById("sites").value = (data.trackedSites || []).join(",");
    document.getElementById("blockTime").value = data.blockTime || 20;
    document.getElementById("messages").value = (data.messages || []).join(",");
    document.getElementById("showTimer").checked = data.showTimer !== false;
  });

  document.getElementById("save").addEventListener("click", () => {
    const sites = document.getElementById("sites").value.split(",").map(s => s.trim()).filter(s => s);
    const blockTime = parseInt(document.getElementById("blockTime").value, 10);
    const messages = document.getElementById("messages").value.split(",").map(m => m.trim()).filter(m => m);
    const showTimer = document.getElementById("showTimer").checked;

    chrome.storage.sync.set({ trackedSites: sites, blockTime, messages, showTimer });

    // notify background so it can broadcast toggleTimer if needed
    chrome.runtime.sendMessage({ type: "toggleTimer", show: showTimer });

    alert("Options saved!");
  });
});

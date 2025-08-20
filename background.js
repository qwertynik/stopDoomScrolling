
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    trackedSites: ["x.com","linkedin.com","instagram.com"],
    blockTime: 20,
    messages: ["Do you really want to scroll further?"],
    showTimer: true
  });
});
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "toggleTimer") {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) chrome.tabs.sendMessage(tab.id, { type: "toggleTimer", show: message.show });
      }
    });
  }
});

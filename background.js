
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["trackedSites", "blockTime", "messages", "showTimer"], (data) => {
    if (!data.trackedSites) {
      chrome.storage.sync.set({ trackedSites: ["x.com", "linkedin.com", "instagram.com"] });
    }
    if (!data.blockTime) {
      chrome.storage.sync.set({ blockTime: 20 });
    }
    if (!data.messages) {
      chrome.storage.sync.set({ messages: ["Do you really want to scroll further?"] });
    }
    if (data.showTimer === undefined) {
      chrome.storage.sync.set({ showTimer: true });
    }
  });
});

// Handle messages from options page to update timer immediately
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "toggleTimer") {
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "toggleTimer", show: message.show });
        }
      }
    });
  }
});

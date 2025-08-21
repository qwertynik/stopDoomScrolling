chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        trackedSites: ["x.com", "linkedin.com", "instagram.com", "facebook.com", "youtube.com"],
        blockTime: 20,
        messages: [
            "Do you want to continue scrolling?",
            "Are your scrolling intentionally?",
            "Do you want to take a break instead?",
            "In what other way you can actively engage yourself?",
        ],
        showTimer: true
    });
});
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "toggleTimer") {
        chrome.tabs.query({}, (tabs) => {
            for (const tab of tabs) {
                if (tab.id) chrome.tabs.sendMessage(tab.id, {type: "toggleTimer", show: message.show});
            }
        });
    }
});


let startTime = Date.now();
let timerInterval;
let blocked = false;
let timerElement;
let showTimer = true;

// Create timer element
function createTimer() {
  if (timerElement) return;
  timerElement = document.createElement("div");
  timerElement.id = "doomscroll-timer";
  timerElement.style.position = "fixed";
  timerElement.style.top = "10px";
  timerElement.style.right = "10px";
  timerElement.style.backgroundColor = "rgba(0,0,0,0.7)";
  timerElement.style.color = "white";
  timerElement.style.padding = "8px 12px";
  timerElement.style.borderRadius = "8px";
  timerElement.style.fontSize = "16px";
  timerElement.style.zIndex = "999999";
  document.body.appendChild(timerElement);
}

// Update timer display
function updateTimer() {
  let elapsed = Math.floor((Date.now() - startTime) / 1000);
  let minutes = Math.floor(elapsed / 60);
  let seconds = elapsed % 60;
  if (timerElement) {
    timerElement.textContent = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }
}

// Remove timer
function removeTimer() {
  if (timerElement) {
    timerElement.remove();
    timerElement = null;
  }
}

// Block modal
function showBlockModal(messages) {
  blocked = true;
  removeTimer();
  let modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "white";
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "999999";
  modal.style.fontSize = "24px";
  modal.style.fontFamily = "sans-serif";
  let message = messages[Math.floor(Math.random() * messages.length)];
  let text = document.createElement("p");
  text.textContent = message;
  let button = document.createElement("button");
  button.textContent = "Continue";
  button.style.marginTop = "20px";
  button.style.padding = "10px 20px";
  button.style.fontSize = "18px";
  button.onclick = () => {
    modal.remove();
    startTime = Date.now();
    blocked = false;
    if (showTimer) {
      createTimer();
    }
  };
  modal.appendChild(text);
  modal.appendChild(button);
  document.body.appendChild(modal);
}

// Initialize
chrome.storage.sync.get(["trackedSites", "blockTime", "messages", "showTimer"], (data) => {
  let host = window.location.hostname;
  if (!data.trackedSites || !data.trackedSites.some(site => host.includes(site))) return;

  showTimer = data.showTimer !== false;

  if (showTimer) {
    createTimer();
    timerInterval = setInterval(updateTimer, 1000);
  }

  setInterval(() => {
    if (!blocked) {
      let elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes >= data.blockTime) {
        showBlockModal(data.messages || ["Do you really want to scroll further?"]);
      }
    }
  }, 1000);
});

// React to toggle changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "toggleTimer") {
    showTimer = message.show;
    if (showTimer) {
      createTimer();
      if (!timerInterval) timerInterval = setInterval(updateTimer, 1000);
    } else {
      removeTimer();
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
});

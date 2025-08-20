
chrome.storage.sync.get(["messages"], ({ messages }) => {
  const msg = messages?.length
    ? messages[Math.floor(Math.random() * messages.length)]
    : "Do you really want to scroll further?";

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(4px);
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const modal = document.createElement("div");
  modal.style.cssText = `
    background: #fff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-size: 18px;
    text-align: center;
    max-width: 400px;
  `;
  modal.innerHTML = `
    <p>${msg}</p>
    <button id="continueBtn">Yes, continue</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById("continueBtn").onclick = () => {
    overlay.remove();
  };
});


let startTime = Date.now();
let timerInterval;
let blocked = false;
let timerElement;
let showTimer = true;
let lastScrollTime = Date.now();
let idleCheckInterval;

function createTimer() {
  if (timerElement) return;
  timerElement = document.createElement("div");
  timerElement.id = "doomscroll-timer";
  Object.assign(timerElement.style, {
    position: "fixed", top: "10px", right: "10px",
    backgroundColor: "rgba(0,0,0,0.8)", color: "white",
    padding: "10px 14px", borderRadius: "10px", fontSize: "16px",
    fontWeight: "600", zIndex: 999999
  });
  timerElement.textContent = "00:00";
  document.documentElement.appendChild(timerElement);
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  if (timerElement) timerElement.textContent = `${m}:${s}`;
}

function removeTimer() { if (timerElement) { timerElement.remove(); timerElement=null; } }

function showBlockModal(messages) {
  blocked = true;
  removeTimer();
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position:"fixed", inset:"0", backgroundColor:"rgba(255,255,255,0.98)",
    display:"grid", placeItems:"center", zIndex:1000000,
    fontFamily:"system-ui,Arial,sans-serif"
  });
  const card=document.createElement("div");
  Object.assign(card.style,{background:"#fff",padding:"24px",borderRadius:"14px",
    boxShadow:"0 10px 40px rgba(0,0,0,0.15)",maxWidth:"520px",textAlign:"center"});
  const p=document.createElement("p");
  p.textContent=messages.length?messages[Math.floor(Math.random()*messages.length)]:"Do you really want to scroll further?";
  p.style.fontSize="18px";p.style.margin="0 0 16px 0";
  const btn=document.createElement("button");
  btn.textContent="Yes, continue";
  Object.assign(btn.style,{padding:"10px 16px",borderRadius:"10px",border:"1px solid #2b6cb0",
    background:"#3182ce",color:"#fff",cursor:"pointer"});
  btn.onclick=()=>{overlay.remove();startTime=Date.now();blocked=false;if(showTimer)createTimer();};
  card.appendChild(p);card.appendChild(btn);overlay.appendChild(card);document.documentElement.appendChild(overlay);
}

chrome.storage.sync.get(["trackedSites","blockTime","messages","showTimer"], (data)=>{
  const host=location.hostname;
  if (!data.trackedSites.some(site=>host.includes(site))) return;
  showTimer=data.showTimer!==false;
  if(showTimer){createTimer();timerInterval=setInterval(updateTimer,1000);}

  // Check limit once per second
  setInterval(()=>{
    if(blocked)return;
    const elapsedMinutes=(Date.now()-startTime)/60000;
    if(elapsedMinutes>=(data.blockTime||20)){showBlockModal(data.messages||[]);}
  },1000);

  // Track scrolling activity
  window.addEventListener("scroll", ()=>{
    lastScrollTime=Date.now();
  });

  // Reset timer if idle (no scroll for >10s)
  idleCheckInterval=setInterval(()=>{
    if(Date.now()-lastScrollTime>10000){
      startTime=Date.now();
      if(timerElement) timerElement.textContent="00:00";
      lastScrollTime=Date.now();
    }
  },1000);
});

chrome.runtime.onMessage.addListener((message)=>{
  if(message.type==="toggleTimer"){
    showTimer=message.show;
    if(showTimer){createTimer();if(!timerInterval)timerInterval=setInterval(updateTimer,1000);}
    else{removeTimer();clearInterval(timerInterval);timerInterval=null;}
  }
});


// --- Scroll inactivity reset (10s) ---
let __dsb_inactivityTimeout = null;
function __dsb_markScrollActivity() {
  if (__dsb_inactivityTimeout) clearTimeout(__dsb_inactivityTimeout);
  __dsb_inactivityTimeout = setTimeout(() => {
    // If no scroll for 10s, reset the session timer
    startTime = Date.now();
    if (timerElement) {
      timerElement.textContent = "00:00";
    }
  }, 10000);
}
// Listen to scroll-like events
window.addEventListener("scroll", __dsb_markScrollActivity, { passive: true });
window.addEventListener("wheel", __dsb_markScrollActivity, { passive: true });
window.addEventListener("touchmove", __dsb_markScrollActivity, { passive: true });
// Initialize inactivity tracker once at load
__dsb_markScrollActivity();


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
  p.style.color="black";
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


// === DSB Tab Reset Hooks (robust) ===
(function(){
  if (window.__DSB_TAB_RESET_GUARD__) return;
  window.__DSB_TAB_RESET_GUARD__ = true;

  function dsbReset(reason){
    try{
      // Reset the session timer and UI
      if (typeof startTime !== "undefined") startTime = Date.now();
      if (typeof blocked !== "undefined") blocked = false;
      if (typeof timerElement !== "undefined" && timerElement) {
        try { timerElement.textContent = "00:00"; } catch(e){}
      }
      // If there is any per-second ticker, restarting is owned by original code.
      // We keep this reset lightweight and idempotent.
      // console.debug("[DSB] reset due to", reason);
    }catch(e){/* no-op */}
  }

  // Fire reset on both hide and show (some pages miss the hidden event due to throttling)
  document.addEventListener("visibilitychange", () => {
    dsbReset(document.hidden ? "visibility_hidden" : "visibility_visible");
  }, { passive: true });

  // Also catch window focus/blur which are more reliable across platforms
  window.addEventListener("blur", () => dsbReset("window_blur"), { passive: true });
  window.addEventListener("focus", () => dsbReset("window_focus"), { passive: true });

  // Handle bfcache restores where visibilitychange might not fire as expected
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) dsbReset("pageshow_bfcache");
  }, { passive: true });
})();
// === End DSB Tab Reset Hooks ===


// ==== DSB: Draggable Timer Patch ====
(function(){
  if (window.__DSB_DRAG_TIMER_GUARD__) return;
  window.__DSB_DRAG_TIMER_GUARD__ = true;

  let __dsb_drag_applied = false;

  function __dsb_applyDragBehavior() {
    if (typeof timerElement === "undefined" || !timerElement) return;
    if (timerElement.__dsbDragBound) { __dsb_drag_applied = true; return; }

    // Visual affordance for drag
    timerElement.style.cursor = "grab";
    timerElement.style.userSelect = "none";
    timerElement.style.touchAction = "none"; // better touch drag
    timerElement.style.zIndex = String(Math.max(999999999, parseInt(timerElement.style.zIndex || "0", 10)));

    // Restore saved position if available
    try {
      chrome.storage.sync.get({ timerPos: null }, (res) => {
        const pos = res && res.timerPos;
        if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
          timerElement.style.left = pos.left + "px";
          timerElement.style.top = pos.top + "px";
          timerElement.style.right = "";
          timerElement.style.bottom = "";
        }
      });
    } catch (e) {}

    let dragging = false;
    let startX = 0, startY = 0;
    let origLeft = 0, origTop = 0;
    let latestLeft = 0, latestTop = 0;

    function clamp(val, min, max){ return Math.min(max, Math.max(min, val)); }

    function onDown(clientX, clientY) {
      dragging = true;
      timerElement.style.cursor = "grabbing";

      const rect = timerElement.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      startX = clientX;
      startY = clientY;

      // Ensure we're using left/top coordinates while dragging
      timerElement.style.left = rect.left + "px";
      timerElement.style.top = rect.top + "px";
      timerElement.style.right = "";
      timerElement.style.bottom = "";

      document.addEventListener("mousemove", onMouseMove, true);
      document.addEventListener("mouseup", onMouseUp, true);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd, true);
    }

    function onMouseDown(e){
      // Left button only
      if (e.button !== 0) return;
      e.preventDefault();
      onDown(e.clientX, e.clientY);
    }

    function onTouchStart(e){
      if (!e.touches || !e.touches.length) return;
      const t = e.touches[0];
      onDown(t.clientX, t.clientY);
      e.preventDefault();
    }

    function onMove(clientX, clientY){
      if (!dragging) return;
      const dx = clientX - startX;
      const dy = clientY - startY;
      const rect = timerElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      latestLeft = clamp(origLeft + dx, 0, window.innerWidth - w);
      latestTop  = clamp(origTop + dy, 0, window.innerHeight - h);
      timerElement.style.left = latestLeft + "px";
      timerElement.style.top  = latestTop + "px";
    }

    function onMouseMove(e){
      e.preventDefault();
      onMove(e.clientX, e.clientY);
    }

    function onTouchMove(e){
      if (!e.touches || !e.touches.length) return;
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
      e.preventDefault();
    }

    function finishDrag(){
      dragging = false;
      timerElement.style.cursor = "grab";
      // Persist position
      try {
        chrome.storage.sync.set({ timerPos: { left: latestLeft, top: latestTop } });
      } catch (e) {}
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("mouseup", onMouseUp, true);
      document.removeEventListener("touchmove", onTouchMove, true);
      document.removeEventListener("touchend", onTouchEnd, true);
    }

    function onMouseUp(e){ e.preventDefault(); finishDrag(); }
    function onTouchEnd(e){ e.preventDefault(); finishDrag(); }

    // Bind handlers
    timerElement.addEventListener("mousedown", onMouseDown);
    timerElement.addEventListener("touchstart", onTouchStart, { passive: false });

    // Mark bound
    timerElement.__dsbDragBound = true;
    __dsb_drag_applied = true;
  }

  // Try until timerElement exists, then stop checking
  const __dsb_check = setInterval(() => {
    try {
      __dsb_applyDragBehavior();
      if (__dsb_drag_applied) clearInterval(__dsb_check);
    } catch(e){ /* ignore */ }
  }, 250);
})();
// ==== End Draggable Timer Patch ====

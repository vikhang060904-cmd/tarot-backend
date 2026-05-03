const btnDealAll = document.getElementById("btnDealAll");
const topicButtons = document.getElementById("topicButtons");
const selectionInfo = document.getElementById("selectionInfo");
const btnConfirmCards = document.getElementById("btnConfirmCards");
const selectedCountSpan = document.getElementById("selectedCount");
const btnAsk = document.getElementById("btnAsk");
const musicBtn = document.getElementById("musicBtn");

const cardsArea = document.getElementById("cards");
const resultBox = document.getElementById("result");
const questionInput = document.getElementById("question");

const portal = document.getElementById("portal");
const wizard = document.getElementById("wizard");
const bubble = document.getElementById("wizardBubble");
const deck = document.getElementById("deck");
const table = document.querySelector(".table");

const bgm = document.getElementById("bgm");
const sfx = document.getElementById("sfx");

let busy = false;
let lastSpreadHTML = "";
let lastCardsData = [];
let selectedCards = [];
let allCards = [];
let currentTopic = "general";
const lines = [
  "🔮 Ngươi muốn hỏi điều gì?",
  "✨ Hãy nói rõ câu hỏi… ta sẽ soi vận mệnh.",
  "🌙 Đặt tay lên bàn, tập trung vào điều ngươi muốn biết…",
  "🪄 Ta đã sẵn sàng. Hỏi đi."
];

function speak(text){
  bubble.textContent = text;
  bubble.classList.add("show");
}

function randLine(){
  return lines[Math.floor(Math.random() * lines.length)];
}

function startMusic(){
  if(!bgm) return;
  if(!bgm.dataset.started){
    bgm.volume = 0.25;
    bgm.play().catch(()=>{});
    bgm.dataset.started = "1";
  }
}

function playSfx(){
  if(!sfx) return;
  sfx.currentTime = 0;
  sfx.volume = 0.6;
  sfx.play().catch(()=>{});
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

/* ====== DEAL ALL CARDS ====== */
async function dealAllCards() {
  if (busy) return;
  busy = true;

  startMusic();
  speak("🔮 Ta đang chia toàn bộ bài bạn…");
  cardsArea.innerHTML = "";
  
  try {
    // Fetch all cards
    const res = await fetch("/api/all_cards");
    const data = await res.json();
    const allDealCards = data.cards;
    
    // Shuffle them
    const shuffled = allDealCards.sort(() => Math.random() - 0.5);
    
    await deal(shuffled);
    lastCardsData = shuffled;
    
    // Show topic buttons
    topicButtons.style.display = "block";
    selectionInfo.style.display = "block";
    selectedCards = [];
    updateSelectionCount();
    
    // Make cards clickable for selection
    const cardWraps = document.querySelectorAll(".card-wrap");
    cardWraps.forEach((wrap, index) => {
      wrap.style.cursor = "pointer";
      wrap.addEventListener("click", () => selectCardForReading(index, wrap));
    });
    
    speak("✨ Hãy chọn chủ đề và nhấp vào 3 lá bài");
  } catch (e) {
    console.error(e);
    speak("⚠️ Lỗi khi chia bài.");
  } finally {
    busy = false;
  }
}

/* ====== SELECT CARD FOR READING ====== */
function selectCardForReading(index, wrap) {
  if (selectedCards.length >= 3) {
    // Check if clicking on already selected
    const cardIndex = selectedCards.findIndex(c => c.index === index);
    if (cardIndex > -1) {
      selectedCards.splice(cardIndex, 1);
      wrap.classList.remove("card-selected");
    } else {
      speak("⚠️ Chỉ được chọn 3 lá!");
      return;
    }
  } else {
    selectedCards.push({ ...lastCardsData[index], index });
    wrap.classList.add("card-selected");
  }
  
  updateSelectionCount();
  
  if (selectedCards.length === 3) {
    btnConfirmCards.style.display = "block";
  } else {
    btnConfirmCards.style.display = "none";
  }
}

/* ====== UPDATE SELECTION COUNT ====== */
function updateSelectionCount() {
  selectedCountSpan.textContent = selectedCards.length;
}

/* ====== CREATE PARTICLES EFFECT ====== */
function createParticles(x, y){
  const particleCount = 5;
  for(let i = 0; i < particleCount; i++){
    const particle = document.createElement("div");
    particle.style.position = "fixed";
    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.width = "8px";
    particle.style.height = "8px";
    particle.style.background = ["#00d4ff", "#aa00ff", "#ff00aa"][Math.floor(Math.random()*3)];
    particle.style.borderRadius = "50%";
    particle.style.boxShadow = "0 0 10px currentColor";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "9999";
    document.body.appendChild(particle);
    
    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 };
    let life = 1;
    
    const animate = () => {
      life -= 0.02;
      particle.style.left = (x + velocity.x * (1 - life) * 50) + "px";
      particle.style.top = (y + velocity.y * (1 - life) * 50) + "px";
      particle.style.opacity = life;
      
      if(life > 0) requestAnimationFrame(animate);
      else particle.remove();
    };
    animate();
  }
}

/* ====== INTRO CINEMATIC ====== */
async function intro(){
  // open portal
  portal.classList.add("open");
  await sleep(450);

  // wizard appears near portal
  wizard.style.opacity = "1";
  wizard.style.transition = "none";
  wizard.style.left = "10%";
  wizard.style.top = "22%";
  wizard.style.transform = "translate(-50%,-50%) scale(.85)";
  wizard.style.filter = "drop-shadow(0 0 45px rgba(170,0,255,.65))";

  // fly to chair (smooth with WAAPI)
  const fly = wizard.animate([
    { transform: "translate(-50%,-50%) scale(.75)", offset: 0 },
    { transform: "translate(-50%,-68%) scale(.85)", offset: 0.55 },
    { transform: "translate(-50%,-50%) scale(.9)", offset: 1 }
  ], { duration: 1100, easing: "cubic-bezier(.2,.8,.2,1)", fill:"forwards" });

  // while flying, move position with CSS transition
  wizard.style.transition = "left 1100ms cubic-bezier(.2,.8,.2,1), top 1100ms cubic-bezier(.2,.8,.2,1)";
  wizard.style.left = "63%";
  wizard.style.top  = "62%";

  await fly.finished.catch(()=>{});
  wizard.classList.add("seated");

  // portal fades a bit
  portal.animate([{opacity:1},{opacity:.55}], {duration:700, fill:"forwards", easing:"ease"} );

  speak("🔮 Ngươi muốn hỏi gì?");
}

/* ====== CARD LAYOUT ====== */
function calcTargets(n){
  const rect = cardsArea.getBoundingClientRect();
  const stageW = rect.width;

  const cardW = (window.innerWidth < 700) ? 76 : 92;
  const gap = (window.innerWidth < 700) ? 18 : 24;

  const total = n*cardW + (n-1)*gap;
  const startX = Math.max(14, (stageW - total)/2);
  const y = Math.max(88, rect.height/2 - 12);

  return Array.from({length:n}, (_,i)=>({
    x: startX + i*(cardW+gap),
    y
  }));
}

function getSpawnPoint(){
  const stageRect = cardsArea.getBoundingClientRect();
  const deckRect  = deck.getBoundingClientRect();

  // spawn at deck center
  const x = (deckRect.left - stageRect.left) + deckRect.width/2;
  const y = (deckRect.top  - stageRect.top)  + deckRect.height/2;
  return { x, y };
}

/* ====== CREATE CARD DOM ====== */
function createCard(card){
  const wrap = document.createElement("div");
  wrap.className = "card-wrap";

  const card3d = document.createElement("div");
  card3d.className = "card3d";

  const back = document.createElement("div");
  back.className = "card-face";
  back.innerHTML = `<img src="/static/images/tarot/back.png" alt="back">`;

  const front = document.createElement("div");
  front.className = "card-face card-front";
  front.innerHTML = `<img src="${card.image}" alt="${card.name}">`;

  card3d.appendChild(back);
  card3d.appendChild(front);
  wrap.appendChild(card3d);

  wrap.addEventListener("click", (e)=> askCardMeaning(e, card));
  return { wrap, card3d };
}

/* ====== DEAL CINEMATIC ====== */
async function deal(cards){
  cardsArea.innerHTML = "";
  table.classList.add("cast");
  wizard.classList.add("casting");
  playSfx();

  speak("✨ Ta bắt đầu trải bài…");

  await sleep(350);

  const spawn = getSpawnPoint();
  const targets = calcTargets(cards.length);

  for(let i=0;i<cards.length;i++){
    const {wrap, card3d} = createCard(cards[i]);
    cardsArea.appendChild(wrap);

    // place at spawn (centered)
    const w = wrap.getBoundingClientRect().width || 92;
    const h = wrap.getBoundingClientRect().height || 138;
    wrap.style.left = (spawn.x - w/2) + "px";
    wrap.style.top  = (spawn.y - h/2) + "px";

    // sparkle burst each deal with enhanced effects
    wizard.animate(
      [{filter:"drop-shadow(0 0 35px rgba(170,0,255,.55))"},
       {filter:"drop-shadow(0 0 60px rgba(200,120,255,.85))"},
       {filter:"drop-shadow(0 0 35px rgba(170,0,255,.55))"}], 
      {duration:380, easing:"ease", fill:"forwards"}
    );

    // enhanced animation: add rotation and scale effects
    const move = wrap.animate([
      { transform:`translate(0,0) rotate(${Math.random()*20-10}deg) scale(.8)`, opacity: 0 },
      { transform:`translate(${(targets[i].x - (spawn.x - w/2)) * 0.3}px, ${-80 + Math.random()*40}px) rotate(${Math.random()*10-5}deg) scale(1.1)`, opacity: 0.8 },
      { transform:`translate(${(targets[i].x - (spawn.x - w/2)) * 0.7}px, ${(targets[i].y - (spawn.y - h/2)) * 0.5}px) rotate(${Math.random()*5-2.5}deg) scale(1)`, opacity: 1 },
      { transform:`translate(${(targets[i].x - (spawn.x - w/2))}px, ${(targets[i].y - (spawn.y - h/2))}px) rotate(0deg) scale(1)`, opacity: 1 }
    ], { duration: 800 + Math.random()*200, easing:"cubic-bezier(.2,.8,.2,1)", fill:"forwards" });

    await move.finished.catch(()=>{}); 

    // lock final position (so it stays after animation)
    wrap.style.left = targets[i].x + "px";
    wrap.style.top  = targets[i].y + "px";
    wrap.getAnimations().forEach(a=>a.cancel());

    // flip with delay
    await sleep(150 + Math.random()*100);
    card3d.classList.add("flipped");

    await sleep(200);
  }

  wizard.classList.remove("casting");
  table.classList.remove("cast");
  speak(randLine());
}

/* ====== DRAW CARDS API ====== */
async function drawCards(cards){
  if(busy) return;
  busy = true;

  startMusic();
  speak("🔮 Ta đang cảm nhận vận mệnh…");
  resultBox.innerHTML = "🔮 Đang kết nối Tarot AI để giải mã...";

  try{
    const res = await fetch("/api/tarot",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        question: questionInput.value || getTopic(),
        cards: cards
      })
    });
    const data = await res.json();

    resultBox.innerHTML = `
      ✨ <b>Kết quả Tarot - ${getTopic()}:</b><br><br>
      ${String(data.answer || "").replace(/\n/g,"<br>")}
      <br><br><small style="opacity:.7">💡 Nhấn vào lá bài để xem ý nghĩa</small>
    `;
  }catch(e){
    console.error(e);
    resultBox.innerHTML = "❌ Lỗi khi kết nối Tarot AI.";
    speak("⚠️ Có nhiễu loạn… thử lại nhé.");
  }finally{
    busy = false;
  }
}

async function askQuestion(){
  const q = (questionInput.value || "").trim();
  if(!q){ alert("Vui lòng nhập câu hỏi!"); return; }
  if(busy) return;
  busy = true;

  startMusic();
  speak("🌙 Ta đang lắng nghe câu hỏi…");
  cardsArea.innerHTML = "";
  resultBox.innerHTML = "🔮 Đang kết nối Tarot AI...";

  try{
    const res = await fetch("/api/ask",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ question: q })
    });
    const data = await res.json();
    resultBox.innerHTML = `
      ✨ <b>Trả lời Tarot:</b><br><br>
      ${String(data.answer || "").replace(/\n/g,"<br>")}
    `;
    speak(randLine());
  }catch(e){
    console.error(e);
    resultBox.innerHTML = "❌ Lỗi khi kết nối Tarot AI.";
    speak("⚠️ Có nhiễu loạn… thử lại nhé.");
  }finally{
    busy = false;
  }
}



  async function askCardMeaning(e, card){
  e?.stopPropagation?.();
  if(busy) return;
  busy = true;

  startMusic();
  speak(`🪄 Ta soi kỹ lá: ${card.name}…`);

  resultBox.innerHTML = "";

  try{
    const res = await fetch("/api/card_meaning",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        name: card.name,
        role: card.role || ""
      })
    });

    const data = await res.json();

    resultBox.innerHTML = `
      <b style="color:#00d4ff;">🔮 ${card.name}</b><br><br>
      ${String(data.answer || "").replace(/\n/g,"<br>")}
    `;

    speak("✨ Lá bài đã hé lộ thông điệp…");

  }catch(e){
    console.error(e);
    resultBox.innerHTML = "❌ Lỗi khi lấy ý nghĩa lá bài.";
    speak("⚠️ Ta chưa nhìn rõ… thử lại nhé.");
  }finally{
    busy = false;
  }
}

/* ====== GET TOPIC NAME ====== */
function getTopic(){
  const topicMap = {
    love: "Tình yêu",
    family: "Gia đình",
    career: "Sự nghiệp",
    health: "Sức khỏe",
    money: "Tài chính",
    general: "Chung"
  };
  return topicMap[currentTopic] || "Chung";
}

/* ====== DEAL ALL CARDS ====== */
async function dealAllCards() {
  if (busy) return;
  busy = true;

  startMusic();
  speak("🔮 Ta đang chia toàn bộ bài bạn…");
  cardsArea.innerHTML = "";
  topicButtons.style.display = "none";
  selectionInfo.style.display = "none";
  
  try {
    const res = await fetch("/api/all_cards");
    const data = await res.json();
    const allDealCards = data.cards;
    
    const shuffled = allDealCards.sort(() => Math.random() - 0.5);
    
    await deal(shuffled);
    lastCardsData = shuffled;
    
    topicButtons.style.display = "block";
    selectionInfo.style.display = "block";
    selectedCards = [];
    updateSelectionCount();
    
    const cardWraps = document.querySelectorAll(".card-wrap");
    cardWraps.forEach((wrap, index) => {
      wrap.style.cursor = "pointer";
      const clickHandler = () => selectCardForReading(index, wrap);
      wrap.addEventListener("click", clickHandler);
    });
    
    speak("✨ Hãy chọn chủ đề và nhấp vào 3 lá bài");
  } catch (e) {
    console.error(e);
    speak("⚠️ Lỗi khi chia bài.");
  } finally {
    busy = false;
  }
}

/* ====== SELECT CARD FOR READING ====== */
function selectCardForReading(index, wrap) {
  const cardIndex = selectedCards.findIndex(c => c.index === index);
  
  if (cardIndex > -1) {
    selectedCards.splice(cardIndex, 1);
    wrap.classList.remove("card-selected");
  } else {
    if (selectedCards.length >= 3) {
      speak("⚠️ Chỉ được chọn 3 lá!");
      return;
    }
    selectedCards.push({ ...lastCardsData[index], index });
    wrap.classList.add("card-selected");
  }
  
  updateSelectionCount();
  
  if (selectedCards.length === 3) {
    btnConfirmCards.style.display = "block";
  } else {
    btnConfirmCards.style.display = "none";
  }
}

/* ====== UPDATE SELECTION COUNT ====== */
function updateSelectionCount() {
  selectedCountSpan.textContent = selectedCards.length;
}

/* ====== INIT ====== */
document.addEventListener("DOMContentLoaded", async ()=>{
  // Bind UI
  btnDealAll?.addEventListener("click", dealAllCards);
  
  // Topic buttons
  const topicBtns = document.querySelectorAll(".topic-btn");
  topicBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      currentTopic = btn.dataset.topic;
      topicBtns.forEach(b => b.style.opacity = "0.6");
      btn.style.opacity = "1";
    });
  });
  
  btnConfirmCards?.addEventListener("click", () => {
    if(selectedCards.length !== 3){
      speak("⚠️ Hãy chọn đúng 3 lá bài!");
      return;
    }
    topicButtons.style.display = "none";
    selectionInfo.style.display = "none";
    drawCards(selectedCards);
  });
  
  btnAsk?.addEventListener("click", askQuestion);

  questionInput?.addEventListener("keypress", (e)=>{
    if(e.key === "Enter") askQuestion();
  });

  musicBtn?.addEventListener("click", ()=>{
    if(!bgm) return;
    if(bgm.paused) startMusic();
    else bgm.pause();
  });

  // Start intro
  await intro();
});
'use strict';
const SK='lixi_config',GK='lixi_game_data',EK='lixi_events';
const DEF={totalEnvelopes:20,title:'Lì Xì Tết 2025',subtitle:'Chúc mừng năm mới · Vạn sự như ý',distribution:{1:2,2:2,3:2,5:3,10:4,15:2,20:5},specialValues:[50,100],specialCount:2,confettiCount:80,features:{confetti:true,petals:true,hint:true}};
function loadCfg(){try{const r=localStorage.getItem(SK);if(r)return Object.assign({},DEF,JSON.parse(r))}catch{}return Object.assign({},DEF)}
function loadGame(){try{const r=localStorage.getItem(GK);if(r)return JSON.parse(r)}catch{}return[]}
function saveGame(d){localStorage.setItem(GK,JSON.stringify(d))}
function logEvent(ev){try{const evs=JSON.parse(localStorage.getItem(EK)||'[]');evs.unshift(ev);localStorage.setItem(EK,JSON.stringify(evs.slice(0,200)))}catch{}}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
const MSG={low:['Năm mới vạn sự như ý! 🌸','Chúc an khang thịnh vượng! 🌺','Tấn tài tấn lộc! 🏮'],mid:['Phú quý vinh hoa! 🎋','Xuân về hạnh phúc tràn đầy! 🌸','Cung chúc tân xuân! 🧧'],high:['Đại cát đại lợi! 💰','Phú quý cát tường! 🎊','Lộc đến đầy nhà! 🏮']};
function getMessage(v){return v<=5?pick(MSG.low):v<=15?pick(MSG.mid):pick(MSG.high)}
function getEmoji(v){return v>=100?'🎊':v>=50?'💰':v>=15?'🏮':v>=10?'🧧':'🌸'}
let CONFIG=loadCfg(),envelopes=[],totalOpened=0,totalAmount=0;
const grid=document.getElementById('envelope-grid');
const statOpened=document.getElementById('stat-opened');
const statTotal=document.getElementById('stat-total');
const statAmount=document.getElementById('stat-amount');
const revealOverlay=document.getElementById('reveal-overlay');
const revealEmoji=document.getElementById('reveal-emoji');
const revealAmt=document.getElementById('reveal-amount');
const revealMsg=document.getElementById('reveal-message');
const revealBtn=document.getElementById('reveal-close-btn');
const resetBtn=document.getElementById('reset-btn');
function initGame(){
  CONFIG=loadCfg();
  const te=document.querySelector('.site-title');const se=document.querySelector('.site-subtitle');
  if(te)te.textContent=CONFIG.title||DEF.title;if(se)se.textContent=CONFIG.subtitle||DEF.subtitle;
  let pool=[];Object.entries(CONFIG.distribution).forEach(([v,q])=>{for(let i=0;i<q;i++)pool.push(Number(v))});
  const total=CONFIG.totalEnvelopes;
  while(pool.length<total)pool.push(pool[Math.floor(Math.random()*pool.length)]);
  pool=shuffle(pool.slice(0,total));
  const sc=Math.min(CONFIG.specialCount,total);
  const sl=shuffle(Array.from({length:total},(_,i)=>i)).slice(0,sc);
  const sv=shuffle([...CONFIG.specialValues]).slice(0,sc);
  envelopes=Array.from({length:total},(_,i)=>{const isSp=sl.includes(i);const si=sl.indexOf(i);return{id:i+1,displayValue:pool[i],realValue:isSp?sv[si]:pool[i],isSpecial:isSp,opened:false,openedAt:null}});
  totalOpened=0;totalAmount=0;saveGame(envelopes);updateStats();renderGrid();
  if(CONFIG.features?.petals!==false)spawnPetals();
  logEvent({type:'GAME_START',ts:new Date().toISOString(),totalEnvelopes:total});
}
function renderGrid(){
  grid.innerHTML='';
  envelopes.forEach((env,idx)=>{
    const card=document.createElement('div');card.className='envelope-card'+(env.opened?' opened':'');card.dataset.id=env.id;card.style.animationDelay=idx*0.04+'s';
    card.innerHTML=`<div class="envelope-face"><span class="envelope-icon">🧧</span><div class="amount-reveal"><span class="amount-emoji">${getEmoji(env.displayValue)}</span><span class="amount-number">${env.displayValue}k</span><span class="amount-unit">nghìn đồng</span></div><span class="envelope-num">#${String(env.id).padStart(2,'0')}</span></div>`;
    if(!env.opened)card.addEventListener('click',()=>openEnvelope(card,env));
    grid.appendChild(card);
  });
}
function openEnvelope(card,env){
  if(env.opened)return;
  env.opened=true;env.openedAt=new Date().toISOString();
  totalOpened++;totalAmount+=env.displayValue;
  card.classList.add('opened');saveGame(envelopes);updateStats();
  logEvent({type:'OPEN',ts:env.openedAt,envelopeId:env.id,displayValue:env.displayValue,realValue:env.realValue,isSpecial:env.isSpecial,userAgent:navigator.userAgent.slice(0,80)});
  setTimeout(()=>showReveal(env),300);
}
function showReveal(env){
  revealEmoji.textContent=getEmoji(env.displayValue);revealAmt.textContent=env.displayValue+'k';revealMsg.textContent=getMessage(env.displayValue);
  revealOverlay.classList.add('show');
  if(CONFIG.features?.confetti!==false)spawnConfetti();
  revealBtn.onclick=()=>{revealOverlay.classList.remove('show');if(env.isSpecial&&CONFIG.features?.hint!==false)showAdminHint(env.realValue)};
}
function showAdminHint(rv){
  const h=document.createElement('div');h.id='admin-hint';
  h.innerHTML=`<div class="admin-hint-card"><div class="hint-icon">🎊</div><p class="hint-title">Bạn nhận lì xì đặc biệt!</p><p class="hint-sub">Mệnh giá thực: <strong>${rv}k</strong></p><p class="hint-desc">Liên hệ quản trị viên để nhận thưởng.</p><button class="btn btn-primary" id="go-admin-btn">Vào Admin Dashboard →</button><button class="btn btn-outline" id="cancel-hint-btn" style="margin-top:10px">Đóng</button></div>`;
  document.body.appendChild(h);
  document.getElementById('go-admin-btn').onclick=()=>window.location.href='/admin';
  document.getElementById('cancel-hint-btn').onclick=()=>h.remove();
}
function updateStats(){statOpened.textContent=totalOpened;statTotal.textContent=CONFIG.totalEnvelopes;statAmount.textContent=totalAmount}
const COLORS=['#ffd700','#ff6b6b','#ff4500','#ffcd3c','#c0392b','#f1c40f','#e8d5b7'];
function spawnConfetti(){for(let i=0;i<(CONFIG.confettiCount||80);i++){const el=document.createElement('div');el.className='confetti';const drift=(Math.random()-.5)*400;el.style.cssText=`left:${20+Math.random()*60}%;top:${20+Math.random()*30}%;background:${pick(COLORS)};width:${6+Math.random()*8}px;height:${10+Math.random()*12}px;--drift:${drift}px;animation-delay:${Math.random()*.5}s;animation-duration:${2.5+Math.random()*2}s;border-radius:${Math.random()>.5?'50%':'2px'}`;document.body.appendChild(el);setTimeout(()=>el.remove(),5000)}}
const PETALS=['🌸','🌺','🍀','⭐','✨','💫'];
function spawnPetals(){document.querySelectorAll('.petal').forEach(p=>p.remove());for(let i=0;i<18;i++){const el=document.createElement('div');el.className='petal';el.textContent=pick(PETALS);el.style.cssText=`left:${Math.random()*100}%;animation-duration:${8+Math.random()*12}s;animation-delay:${Math.random()*10}s;font-size:${.7+Math.random()*.9}rem;opacity:0`;document.body.appendChild(el)}}
resetBtn.addEventListener('click',()=>{if(totalOpened===0||confirm('Bạn có chắc muốn chơi lại không?'))initGame()});
// Listen for admin config changes → reload config dynamically
window.addEventListener('storage',e=>{if(e.key===SK){CONFIG=loadCfg();const te=document.querySelector('.site-title');const se=document.querySelector('.site-subtitle');if(te)te.textContent=CONFIG.title||DEF.title;if(se)se.textContent=CONFIG.subtitle||DEF.subtitle}});
document.addEventListener('DOMContentLoaded',initGame);

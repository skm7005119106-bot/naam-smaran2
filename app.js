let currentTab="homeTab";
const $=id=>document.getElementById(id);
function render(){
 $("homeJaps").textContent=state.todayJaps;$("homeMalas").textContent=Math.floor(state.todayJaps/108);$("homeTotal").textContent=state.totalJaps;
 ["japMantra","circleMantra","homeMantra","profileMantra"].forEach(id=>$(id).textContent=state.selectedNaam);
 $("circleCount").textContent=state.todayJaps%108;$("progressText").textContent=`${state.todayJaps%108} / 108`;
 $("progressBar").style.width=((state.todayJaps%108)/108*100)+"%";
 $("profileName").textContent=state.userName||"Sadhak";$("profileTotal").textContent=state.totalJaps;$("profileMala").textContent=state.totalMalas;$("profileStreak").textContent=state.streak||0;
 const [mt,mx]=milestoneInfo();$("milestoneTitle").textContent=mt;$("milestoneText").textContent=mx;
 renderNaams();renderBeads();
}
function renderBeads(){let html="";for(let i=0;i<108;i++)html+=`<i class="${i<(state.todayJaps%108)?"done":""}"></i>`;$("beads").innerHTML=html}
function renderNaams(){$("naamList").innerHTML=state.naams.map(n=>`<button class="naam-option ${n===state.selectedNaam?"selected":""}" data-name="${n}"><span>🪷 ${n}</span><span>${n===state.selectedNaam?"✓":"›"}</span></button>`).join("")}
function showTab(id){currentTab=id;document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.tab===id));window.scrollTo(0,0)}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1600)}
function tapJap(){const before=state.todayJaps;incrementJap();beep();if(navigator.vibrate)navigator.vibrate(8);$("flash").classList.remove("pop");void $("flash").offsetWidth;$("flash").classList.add("pop");render();if((before+1)%108===0){malaSound();toast("🌸 1 Mala Complete • 108 Jap 🙏")}}
function init(){
 loadState();
 const setupDone=!!state.userName;
 setTimeout(()=>{$("splash").classList.add("hidden");if(setupDone)$("mainApp").classList.remove("hidden");else $("onboarding").classList.remove("hidden");render()},1800);
 document.querySelectorAll("#mantraChoices button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#mantraChoices button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("customMantraInput").classList.toggle("hidden",b.dataset.mantra!=="Custom");});
 $("startBtn").onclick=()=>{const name=$("userNameInput").value.trim();const selected=document.querySelector("#mantraChoices .selected");if(!name){toast("Apna naam likhiye");return}if(!selected){toast("Jap Naam choose karein");return}let m=selected.dataset.mantra;if(m==="Custom"){m=$("customMantraInput").value.trim();if(!m){toast("Custom Naam likhiye");return}if(!state.naams.includes(m))state.naams.push(m)}state.userName=name;state.selectedNaam=m;state.lastDate=today();saveState();$("onboarding").classList.add("hidden");$("mainApp").classList.remove("hidden");render();showTab("homeTab")};
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
 $("japCircle").onclick=tapJap;$("undoBtn").onclick=()=>{if(undoJap()){render();toast("Last Jap undone")}else toast("Undo ke liye Jap nahi hai")};
 $("resetBtn").onclick=()=>{state.todayJaps=0;saveState();render();toast("Mala reset ho gayi")};
 $("homeStart").onclick=()=>showTab("japTab");
 $("naamList").onclick=e=>{const b=e.target.closest(".naam-option");if(b){setNaam(b.dataset.name);render();toast("Naam selected: "+b.dataset.name)}};
 $("addNaam").onclick=()=>{const n=$("newNaam").value.trim();if(!n)return;if(!state.naams.includes(n))state.naams.push(n);state.selectedNaam=n;saveState();$("newNaam").value="";render();toast("Naam added")};
 $("soundToggle").onclick=()=>{soundOn=!soundOn;$("soundToggle").textContent=soundOn?"🔊":"🔇"};
 $("editProfile").onclick=()=>{const n=prompt("Your Name",state.userName);if(n&&n.trim()){state.userName=n.trim();saveState();render()}};
}
init();

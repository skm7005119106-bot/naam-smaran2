const STORAGE_KEY="naamSmaran.data.v2";
const DEFAULT={userName:"",selectedNaam:"Radha",naams:["Radha","Krishna","Ram","Siya Ram","Om"],todayJaps:0,totalJaps:0,totalMalas:0,streak:0,lastDate:"",history:{}};
let state={...DEFAULT};
function today(){return new Date().toISOString().slice(0,10)}
function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state={...DEFAULT,...JSON.parse(raw)};}catch(e){} if(!Array.isArray(state.naams)||!state.naams.length)state.naams=[...DEFAULT.naams]; if(state.lastDate!==today()){state.todayJaps=0;state.lastDate=today()} saveState()}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function incrementJap(){state.todayJaps++;state.totalJaps++;state.history[today()]=(state.history[today()]||0)+1;state.totalMalas=Math.floor(state.totalJaps/108);saveState()}
function undoJap(){if(state.todayJaps>0){state.todayJaps--;state.totalJaps=Math.max(0,state.totalJaps-1);state.history[today()]=Math.max(0,(state.history[today()]||0)-1);state.totalMalas=Math.floor(state.totalJaps/108);saveState();return true}return false}
function setNaam(n){state.selectedNaam=n;saveState()}

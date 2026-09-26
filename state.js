const STORAGE_KEY="naamSmaran.data.v3";
const DEFAULT={userName:"",selectedNaam:"Radha",naams:["Radha","Krishna","Ram","Siya Ram","Om"],todayJaps:0,totalJaps:0,totalMalas:0,streak:0,lastDate:"",history:{},lastTap:0};
let state={...DEFAULT};
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){}}
function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)state={...DEFAULT,...JSON.parse(raw)}}catch(e){state={...DEFAULT}}if(!Array.isArray(state.naams)||!state.naams.length)state.naams=[...DEFAULT.naams];const t=today();if(state.lastDate!==t){state.todayJaps=0;state.lastDate=t}saveState()}
function updateStreak(){const t=today();if(state.history[t]>0){if(state.history[yesterday()]>0)state.streak=Math.max(1,state.streak||1);else state.streak=1}}
function incrementJap(){const t=today();state.todayJaps++;state.totalJaps++;state.history[t]=(state.history[t]||0)+1;state.totalMalas=Math.floor(state.totalJaps/108);updateStreak();state.lastTap=Date.now();saveState()}
function undoJap(){if(state.todayJaps<=0)return false;const t=today();state.todayJaps--;state.totalJaps=Math.max(0,state.totalJaps-1);state.history[t]=Math.max(0,(state.history[t]||0)-1);state.totalMalas=Math.floor(state.totalJaps/108);updateStreak();saveState();return true}
function setNaam(n){state.selectedNaam=n;saveState()}
function milestoneInfo(){const n=state.totalJaps;if(n>=1080)return ["1080 Jap","आपने 10 माला का सुंदर पड़ाव पूरा किया है।"] ;if(n>=108)return ["पहली माला","108 जाप — आपकी साधना की पहली माला पूर्ण हुई।"];if(n>=1)return ["पहला जाप","आपकी Naam Smaran यात्रा शुरू हो गई है।"];return ["पहला जाप","एक जाप से शुरुआत करें और मन को शांत करें।"]}

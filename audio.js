let soundOn=true;let audioCtx=null;
function getAudio(){if(!soundOn)return null;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(e){return null}}
function tone(freq,duration=.09,volume=.075,type='sine',delay=0){const c=getAudio();if(!c)return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.02)}
function beep(){const n=state.todayJaps%7;tone(430+n*55,.075,.065,'sine');tone(820+n*25,.045,.035,'triangle',.025)}
function malaSound(){tone(520,.16,.08,'sine');tone(780,.16,.08,'sine',.12);tone(1040,.22,.09,'sine',.24)}
function splashSound(){tone(392,.18,.045,'sine');tone(523,.2,.05,'sine',.15);tone(659,.3,.06,'sine',.32)}

const { getClient } = require('./db');
const { getIo } = require('./socket');
const PICK_SECONDS = 50;
const SHUFFLE_SECONDS = 7;
const CALL_INTERVAL_MS = 5000;
let current = null;
let timers = {};
function generateCard(seed){
  const ranges=[[1,15],[16,30],[31,45],[46,60],[61,75]];
  const card = Array.from({length:5},()=>Array(5).fill(null));
  for(let c=0;c<5;c++){
    const set=[];
    for(let r=0;r<5;r++){
      const v = ranges[c][0] + ((seed * (c+7) + r*13) % (ranges[c][1]-ranges[c][0]+1));
      set.push(v);
    }
    for(let r=0;r<5;r++) card[r][c]=set[r];
  }
  card[2][2]='FREE';
  return card;
}
const PREBUILT = Array.from({length:400}, (_,i)=> generateCard(i+1));
async function startPicking(stake=10){
  const client = getClient();
  const res = await client.query('INSERT INTO games(status, stake_amount, shuffle_sequence, current_index) VALUES($1,$2,$3,$4) RETURNING *',['picking', stake, null, 0]);
  current = res.rows[0];
  current.phase='picking';
  current.pickEnd = Date.now() + PICK_SECONDS*1000;
  emitAll('game:started', { phase:'picking', pickEndsIn:PICK_SECONDS });
  clearTimers();
  timers.shuffle = setTimeout(()=> startShuffle(), PICK_SECONDS*1000);
  return current;
}
function clearTimers(){
  Object.values(timers).forEach(t=> clearTimeout(t));
  timers = {};
  if(current && current.callInterval){ clearInterval(current.callInterval); current.callInterval = null; }
}
function emitAll(evt, data){ const io = getIo(); if(io) io.emit(evt,data); }
async function startShuffle(){
  if(!current) return;
  current.phase='shuffling';
  emitAll('game:phase', { phase:'shuffling', seconds: SHUFFLE_SECONDS });
  const seq = Array.from({length:75}, (_,i)=>i+1);
  for(let i=seq.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [seq[i],seq[j]]=[seq[j],seq[i]]; }
  const client = getClient();
  await client.query('UPDATE games SET shuffle_sequence=$1 WHERE id=$2',[JSON.stringify(seq), current.id]);
  current.shuffle_sequence = seq;
  timers.start = setTimeout(()=> startRunning(), SHUFFLE_SECONDS*1000);
}
async function startRunning(){
  if(!current) return;
  current.phase='running';
  current.currentIndex = 0;
  emitAll('game:phase', { phase:'running' });
  const seq = current.shuffle_sequence;
  current.callInterval = setInterval(async ()=>{
    if(!current) return;
    if(current.currentIndex >= seq.length){ clearInterval(current.callInterval); return; }
    const num = seq[current.currentIndex++];
    await getClient().query('UPDATE games SET current_index=$1 WHERE id=$2',[current.currentIndex, current.id]);
    emitAll('number:called', { num });
  }, CALL_INTERVAL_MS);
}
async function stopGame(){
  clearTimers();
  if(current){
    await getClient().query('UPDATE games SET status=$1 WHERE id=$2',['completed', current.id]);
    emitAll('game:stopped', {});
  }
  current = null;
}
module.exports = { PREBUILT, startPicking, startShuffle, startRunning, stopGame, getCurrent: ()=> current };

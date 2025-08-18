const express = require('express');
const router = express.Router();
const game = require('./gameEngine');
const { getClient } = require('./db');

router.post('/game/pick', async (req,res)=>{
  const { telegramId, chosenNumber } = req.body;
  if(!telegramId || !chosenNumber) return res.status(400).json({ error:'missing' });
  const client = getClient();
  let u = await client.query('SELECT * FROM users WHERE telegram_id=$1',[telegramId]);
  let user = u.rows[0];
  if(!user){
    const ins = await client.query('INSERT INTO users(telegram_id) VALUES($1) RETURNING *',[telegramId]);
    user = ins.rows[0];
  }
  const gq = await client.query("SELECT * FROM games WHERE status IN ('picking','running') ORDER BY id DESC LIMIT 1");
  if(gq.rows.length===0) return res.status(400).json({ error:'no active game' });
  const gameRow = gq.rows[0];
  if(gameRow.status !== 'picking') return res.json({ ok:false, msg:'Please wait until next game started' });
  const taken = await client.query('SELECT * FROM player_choices WHERE game_id=$1 AND chosen_number=$2',[gameRow.id, chosenNumber]);
  if(taken.rows.length>0) return res.status(400).json({ error:'taken' });
  const card = game.PREBUILT[chosenNumber-1];
  const pc = await client.query('INSERT INTO player_choices(game_id,user_id,chosen_number,card_json) VALUES($1,$2,$3,$4) RETURNING *',[gameRow.id, user.id, chosenNumber, JSON.stringify(card)]);
  const { getIo } = require('./socket'); const io = getIo(); if(io) io.emit('player:joined',{ telegramId, chosenNumber });
  res.json({ ok:true, card });
});

router.post('/game/bingo', async (req,res)=>{
  const { telegramId } = req.body;
  if(!telegramId) return res.status(400).json({ error:'missing' });
  const client = getClient();
  const u = await client.query('SELECT * FROM users WHERE telegram_id=$1',[telegramId]);
  if(u.rows.length===0) return res.status(404).json({ error:'user' });
  const user = u.rows[0];
  const pcq = await client.query('SELECT * FROM player_choices WHERE user_id=$1 ORDER BY id DESC LIMIT 1',[user.id]);
  if(pcq.rows.length===0) return res.status(400).json({ error:'no card' });
  const pc = pcq.rows[0];
  const gq = await client.query('SELECT * FROM games WHERE id=$1',[pc.game_id]);
  const gameRow = gq.rows[0];
  const seq = JSON.parse(gameRow.shuffle_sequence || '[]').slice(0, gameRow.current_index || 0);
  const card = JSON.parse(pc.card_json);
  function marked(r,c){ const v = card[r][c]; if(v==='FREE') return true; return seq.includes(v); }
  let win=false;
  for(let r=0;r<5;r++) if([0,1,2,3,4].every(c=>marked(r,c))) win=true;
  for(let c=0;c<5;c++) if([0,1,2,3,4].every(r=>marked(r,c))) win=true;
  if([0,1,2,3,4].every(i=>marked(i,i))) win=true;
  if([0,1,2,3,4].every(i=>marked(i,4-i))) win=true;
  if(!win){
    await client.query('UPDATE player_choices SET status=$1 WHERE id=$2',['disqualified', pc.id]);
    const { getIo } = require('./socket'); const io = getIo(); if(io) io.emit('player:disqualified',{ telegramId });
    return res.json({ ok:false, reason:'invalid' });
  }
  await client.query('UPDATE player_choices SET status=$1 WHERE id=$2',['winner', pc.id]);
  const totalPlayersQ = await client.query('SELECT COUNT(*) FROM player_choices WHERE game_id=$1',[pc.game_id]);
  const totalPlayers = parseInt(totalPlayersQ.rows[0].count || '0');
  const stake = gameRow.stake_amount || 10;
  const pot = totalPlayers * stake;
  const winnersQ = await client.query('SELECT COUNT(*) FROM player_choices WHERE game_id=$1 AND status=$2',[pc.game_id,'winner']);
  const numWinners = parseInt(winnersQ.rows[0].count || '1');
  const housePct = 0.20;
  const share = (pot * (1-housePct)) / Math.max(1, numWinners);
  await client.query('UPDATE users SET balance_withdrawable = balance_withdrawable + $1 WHERE id=$2',[share, user.id]);
  await client.query('INSERT INTO transactions(user_id,type,amount,status,meta) VALUES($1,$2,$3,$4,$5)',[user.id,'win',share,'completed', JSON.stringify({ game: pc.game_id })]);
  const { getIo } = require('./socket'); const io = getIo(); if(io) io.emit('player:win',{ telegramId, share });
  res.json({ ok:true, share });
});

// admin endpoints
router.post('/admin/login', async (req,res)=>{
  const { username, password } = req.body;
  if(username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS){
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    global.adminSessions = global.adminSessions || {};
    global.adminSessions[token] = { createdAt: Date.now(), expiresAt: Date.now() + (20 * 60 * 1000) }; // 20 minutes timeout
    return res.json({ ok:true, token });
  }
  return res.status(403).json({ ok:false });
});

function requireAdmin(req,res,next){
  const token = req.headers['x-admin-token'];
  if(!token) return res.status(401).json({ error:'no token' });
  
  if(global.adminSessions && global.adminSessions[token]) {
    // Check if session has expired
    if(global.adminSessions[token].expiresAt && global.adminSessions[token].expiresAt < Date.now()) {
      delete global.adminSessions[token]; // Remove expired session
      return res.status(401).json({ error:'session expired' });
    }
    return next();
  }
  return res.status(403).json({ error:'invalid' });
}

router.get('/admin/players', requireAdmin, async (req,res)=>{
  const client = getClient();
  const q = await client.query('SELECT id, telegram_id, username, balance_withdrawable, balance_nonwithdrawable, created_at FROM users ORDER BY created_at DESC');
  res.json(q.rows);
});

router.delete('/admin/players/:id', requireAdmin, async (req,res)=>{
  const id = req.params.id;
  const client = getClient();
  await client.query('DELETE FROM player_choices WHERE user_id=$1',[id]);
  await client.query('DELETE FROM transactions WHERE user_id=$1',[id]);
  await client.query('DELETE FROM users WHERE id=$1',[id]);
  res.json({ ok:true });
});

router.get('/admin/transactions', requireAdmin, async (req,res)=>{
  const client = getClient();
  const q = await client.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 200');
  res.json(q.rows);
});

router.post('/admin/game/start', requireAdmin, async (req,res)=>{
  const stake = req.body.stake || 10;
  const g = await require('./gameEngine').startPicking(stake);
  res.json({ ok:true, game: g });
});

router.post('/admin/game/stop', requireAdmin, async (req,res)=>{  await require('./gameEngine').stopGame();  res.json({ ok:true });});

router.get('/admin/game/status', requireAdmin, async (req,res)=>{  const current = require('./gameEngine').getCurrent();  if(!current) {    return res.json({ ok:true, game: null });  }  res.json({ ok:true, game: current });});

router.post('/admin/logout', requireAdmin, async (req,res)=>{
  const token = req.headers['x-admin-token'];
  if(token && global.adminSessions && global.adminSessions[token]) {
    delete global.adminSessions[token];
  }
  res.json({ ok:true });
});

module.exports = router;

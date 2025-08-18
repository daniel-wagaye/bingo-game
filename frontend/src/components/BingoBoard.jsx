import React, { useEffect, useState } from 'react';
import axios from 'axios';
export default function BingoBoard({ calledNumbers=[] }){
  const [card, setCard] = useState(null);
  const [picked, setPicked] = useState(null);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  function renderGrid(){
    if(!card) return null;
    return (
      <div className="board">
        {card.map((row,r)=>row.map((val,c)=>(
          <div key={`${r}-${c}`} className={'cell '+(val==='FREE'?' free':'')}>
            {val==='FREE'?'★':val}
          </div>
        )))}
      </div>
    );
  }
  async function pick(n){
    try{
      const res = await axios.post(API + '/game/pick', { telegramId: Date.now()%100000, chosenNumber: n });
      if(res.data && res.data.card){ setCard(res.data.card); setPicked(n); }
      else alert(res.data.msg || res.data.error || 'Pick failed');
    }catch(e){ alert('Pick error: ' + (e.response?.data?.error || e.message)); }
  }
  if(!card) return (
    <div>
      <h4>Pick a card 1-400</h4>
      <div style={{display:'grid',gridTemplateColumns:'repeat(20,28px)',gap:6,maxHeight:220,overflow:'auto'}}>
        {Array.from({length:400}).map((_,i)=> <button key={i} onClick={()=>pick(i+1)} style={{width:28,height:28}}>{i+1}</button>)}
      </div>
    </div>
  );
  return renderGrid();
}

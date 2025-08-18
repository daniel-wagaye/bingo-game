import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import io from 'socket.io-client';
import BingoBoard from './components/BingoBoard';
import AdminDashboard from './components/AdminDashboard';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function BingoGame(){
  const [called, setCalled] = useState([]);
  const [current, setCurrent] = useState(null);
  const [gamePhase, setGamePhase] = useState('idle');
  const socketRef = useRef(null);
  useEffect(()=>{
    socketRef.current = io(SOCKET_URL);
    const s = socketRef.current;
    s.on('number:called', ({ num })=>{ setCurrent(num); setCalled(prev=>[...prev, num]); });
    s.on('game:phase', ({ phase })=> setGamePhase(phase));
    s.on('game:started', (d)=> setGamePhase(d.phase));
    return ()=> s.disconnect();
  },[]);
  return (
    <div className="app-root">
      <div style={{display:'flex',gap:12,justifyContent:'center',marginBottom:12}}>
        <div className="info">Game<div className="big">Bingo</div></div>
        <div className="info">Players<div className="big">--</div></div>
        <div className="info">Bet<div className="big">10</div></div>
        <div className="info">Call<div className="big">{called.length}</div></div>
        <Link to="/admin" className="info" style={{textDecoration:'none',color:'inherit'}}>
          Admin<div className="big">⚙️</div>
        </Link>
      </div>
      <div style={{display:'flex',gap:20,justifyContent:'center',flexWrap:'wrap'}}>
        <div style={{width:220}}>
          <div className="current-call">
            <div className="status"> {gamePhase.toUpperCase()} </div>
            <div className="current-circle">{current? 'N-'+current : '-'}</div>
            <div className="history">{called.slice(-3).reverse().map((c,i)=>(<span key={i} className='hist'>{c}</span>))}</div>
          </div>
        </div>
        <div className="card-wrapper">
          <BingoBoard calledNumbers={called} />
        </div>
      </div>
    </div>
  );
}

export default function App(){
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BingoGame />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

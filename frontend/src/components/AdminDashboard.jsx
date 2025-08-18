import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon, TrashIcon, UserGroupIcon, CurrencyDollarIcon, ChartBarIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
};

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [gameLoading, setGameLoading] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (isLoggedIn && adminToken) {
      loadPlayers();
      fetchGameStatus();
    }
  }, [isLoggedIn, adminToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setAdminToken(data.token);
        setIsLoggedIn(true);
        showToast('Login successful!', 'success');
        loadPlayers(data.token);
      } else {
        showToast('Login failed. Please check your credentials.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async (token = adminToken) => {
    try {
      const response = await fetch(`${API_URL}/admin/players`, {
        headers: {
          'x-admin-token': token
        }
      });
      
      const playersData = await response.json();
      setPlayers(playersData);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to load players. Please try again.', 'error');
    }
  };

  const deletePlayer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/players/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken
        }
      });
      
      const data = await response.json();
      
      if (data.ok) {
        showToast('Player deleted successfully.', 'success');
        loadPlayers();
      } else {
        showToast('Failed to delete player.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('An error occurred. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/logout`, {
        method: 'POST',
        headers: {
          'x-admin-token': adminToken
        }
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setAdminToken('');
        setIsLoggedIn(false);
        setUsername('');
        setPassword('');
        setPlayers([]);
        showToast('Logged out successfully.', 'success');
      } else {
        showToast('Logout failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('An error occurred during logout. Please try again.', 'error');
    }
  };

  const fetchGameStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/game/status`, {
        headers: {
          'x-admin-token': adminToken
        }
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setGameStatus(data.game);
      } else {
        showToast('Failed to fetch game status.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('An error occurred while fetching game status.', 'error');
    }
  };

  const startGame = async () => {
    setGameLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/game/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify({ stake: 10 })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        showToast('Game started successfully!', 'success');
        fetchGameStatus();
      } else {
        showToast('Failed to start game.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('An error occurred while starting the game.', 'error');
    } finally {
      setGameLoading(false);
    }
  };

  const stopGame = async () => {
    setGameLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/game/stop`, {
        method: 'POST',
        headers: {
          'x-admin-token': adminToken
        }
      });
      
      const data = await response.json();
      
      if (data.ok) {
        showToast('Game stopped successfully!', 'success');
        fetchGameStatus();
      } else {
        showToast('Failed to stop game.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('An error occurred while stopping the game.', 'error');
    } finally {
      setGameLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-container">
        {/* Background Pattern */}
        <div className="admin-bg-pattern"></div>
        
        {/* Login Card */}
        <div className="admin-login-card">
          {/* Frosted Glass Effect */}
          <div className="admin-glass-bg"></div>
          
          {/* Content */}
          <div className="admin-card-content">
            <div className="admin-header">
              <div className="admin-icon">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="admin-title">Admin Panel</h1>
              <p className="admin-subtitle">Sign in to manage your bingo game</p>
            </div>
            
            <form onSubmit={handleLogin} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="admin-input"
                  placeholder="Enter your username"
                  required
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-label">
                  Password
                </label>
                <div className="admin-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="admin-input admin-password-input"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="admin-password-toggle"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="admin-submit-btn"
              >
                {loading ? (
                  <div className="admin-loading">
                    <div className="admin-spinner"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-left">
            <ChartBarIcon className="dashboard-header-icon" />
            <h1 className="dashboard-header-title">Bingo Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="dashboard-logout-btn"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-card-content">
              <UserGroupIcon className="stats-icon blue" />
              <div className="stats-info">
                <p className="stats-label">Total Players</p>
                <p className="stats-value">{players.length}</p>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-card-content">
              <CurrencyDollarIcon className="stats-icon green" />
              <div className="stats-info">
                <p className="stats-label">Total Balance</p>
                <p className="stats-value">
                  ${players.reduce((sum, player) => sum + (player.balance_withdrawable || 0) + (player.balance_nonwithdrawable || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          

        </div>

        {/* Game Control */}
        <div className="game-control-container">
          <div className="game-control-header">
            <h2 className="game-control-title">Game Control</h2>
            <div className="game-status">
              {gameStatus ? (
                <span className="game-status-active">Game Active - Phase: {gameStatus.phase}</span>
              ) : (
                <span className="game-status-inactive">No Active Game</span>
              )}
            </div>
          </div>
          
          <div className="game-control-buttons">
            <button
              onClick={startGame}
              disabled={gameLoading || gameStatus}
              className="game-btn start-btn"
            >
              {gameLoading ? (
                <div className="game-btn-loading">
                  <div className="game-spinner"></div>
                  Starting...
                </div>
              ) : (
                <>
                  <PlayIcon className="game-btn-icon" />
                  Start Game
                </>
              )}
            </button>
            
            <button
              onClick={stopGame}
              disabled={gameLoading || !gameStatus}
              className="game-btn stop-btn"
            >
              {gameLoading ? (
                <div className="game-btn-loading">
                  <div className="game-spinner"></div>
                  Stopping...
                </div>
              ) : (
                <>
                  <StopIcon className="game-btn-icon" />
                  Stop Game
                </>
              )}
            </button>
          </div>
        </div>

        {/* Players Table */}
        <div className="players-table-container">
          <div className="players-table-header">
            <h2 className="players-table-title">Players</h2>
          </div>
          
          <div className="table-wrapper">
            <table className="players-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">ID</th>
                  <th className="table-header-cell">Telegram ID</th>
                  <th className="table-header-cell">Username</th>
                  <th className="table-header-cell">Withdrawable</th>
                  <th className="table-header-cell">Non-withdrawable</th>
                  <th className="table-header-cell">Created At</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {players.map((player) => (
                  <tr key={player.id} className="table-row">
                    <td className="table-cell">{player.id}</td>
                    <td className="table-cell">{player.telegram_id}</td>
                    <td className="table-cell">{player.username || 'N/A'}</td>
                    <td className="table-cell">${(player.balance_withdrawable || 0).toFixed(2)}</td>
                    <td className="table-cell">${(player.balance_nonwithdrawable || 0).toFixed(2)}</td>
                    <td className="table-cell table-cell-date">
                      {new Date(player.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <button
                          onClick={() => deletePlayer(player.id)}
                          className="delete-btn"
                        >
                          <TrashIcon className="delete-icon" />
                          Delete
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {players.length === 0 && (
              <div className="no-players">
                <UserGroupIcon className="no-players-icon" />
                <p className="no-players-text">No players found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
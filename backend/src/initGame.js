require('dotenv').config();
const { startPicking } = require('./gameEngine');
const { initDb } = require('./db');

// Initialize the database first, then start a game
initDb().then(() => {
  console.log('Database initialized');
  // Initialize a new game with a stake amount of 10
  return startPicking(10);
}).then(() => {
  console.log('Game initialized successfully!');
  // Keep the process running for a bit to allow the game to be created
  setTimeout(() => process.exit(0), 3000);
}).catch(err => {
  console.error('Error initializing game:', err);
  process.exit(1);
});
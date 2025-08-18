require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./socket');
const routes = require('./routes');
const { initDb } = require('./db');
require('./bot'); // telegram bot (reads token from env)

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.get('/', (req,res)=> res.send({ok:true, msg:'Bingo backend'}));

initDb().then(()=>{
  const server = http.createServer(app);
  initSocket(server);
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, ()=> console.log('Server listening on', PORT));
}).catch(err=> console.error(err));

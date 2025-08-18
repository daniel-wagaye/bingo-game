let ioRef = null;
function initSocket(server){
  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: "*" } });
  io.on('connection', socket => {
    console.log('socket connected', socket.id);
  });
  ioRef = io;
  return io;
}
function getIo(){ return ioRef; }
module.exports = { initSocket, getIo };

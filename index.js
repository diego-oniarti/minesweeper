/*const express = require('express');
const socket = require('socket.io');
const path = require('path')


const PORT = process.env.PORT || 3000

const app = express();
const server = app.listen(PORT,()=>{
    console.log("Socket server running on port "+PORT)
});

app.use(express.static('client'));

const io = socket(server,{
    cors: {
        origin: `https://minesweeper2357.onrender.com:${PORT}`,
        methods: ["GET", "POST"]
    }
});
io.sockets.on('connection',(socket)=>{
    console.log(`new connection: ${socket.id}`);

    socket.on('check', (data)=>{
        console.log(data);
        console.log(socket.room)
    });

    socket.on('join', (data)=>{
        const roomName=`${data.key}`;
        if (io.sockets.adapter.rooms.get(roomName) && io.sockets.adapter.rooms.get(roomName).size==2){
            return;
        }
        socket.join(roomName)
        socket.room = roomName;
        if (io.sockets.adapter.rooms.get(roomName).size==2){
            io.to(roomName).emit('start',{seed:Math.random()*1000});
        }
    });

    socket.on('mossa', (mossa)=>{
        mossa.author = socket.id;
        socket.to(socket.room).emit('mossa2',mossa);
    })

    socket.on('disconnect', (reason)=>{
        console.log(`Disconnected ${socket.id}`);        
    });


});
*/

const path = require('path')
const express = require('express')
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ server:server });

rooms = {};

wss.on('connection', (ws)=> {
  ws.on('message', (message) => {
    const tmp = JSON.parse(message);
    console.log(tmp);
    switch(tmp.event){
        case "join":
            const roomName=`${tmp.key}`;
            if (rooms[roomName] && rooms[roomName].size==2){
                return;
            }
            if (!rooms[roomName] || rooms[roomName].size==0) {
                rooms[roomName] = new Set();
                ws.primo=true;
                ws.tempo=tmp.tempo
            }
            rooms[roomName].add(ws);
            ws.room = roomName;
            if (rooms[roomName].size==2){
                const seed = Math.random()*1000;
                const tempo = [...rooms[roomName]].filter(w=>{return w.primo})[0].tempo
                rooms[roomName].forEach(w=>{w.send(JSON.stringify({event:'start',seed:seed,primoTurno:w.primo,tempo:tempo}))});
            }
            break;
        case "mossa":
            tmp.mossa.author = "b"
            rooms[ws.room].forEach(w=>{if (w!=ws) w.send(JSON.stringify({event:'mossa2',mossa:tmp.mossa}))})
            break;
        case "overtime":
                rooms[ws.room].forEach(w=>{if (w!=ws) w.send(JSON.stringify({event:'overtime'}))})
                break;
        case "leave":
            if (ws.room && rooms[ws.room].has(ws)){
                rooms[ws.room].delete(ws);
                rooms[ws.room].forEach(w=>{w.send(JSON.stringify({event:'enemy_disconnected'})); w.primo=true})
                rooms[ws.room].clear();
            }
            break;
    }

    /*socket.on('disconnect', (reason)=>{
        console.log(`Disconnected ${socket.id}`);        
    });*/
    });
});

app.use(express.static('client'));

server.listen(PORT, () => console.log(`Lisening on port : ${PORT}`))
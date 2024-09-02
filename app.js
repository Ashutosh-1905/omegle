const express = require("express");
const app = express(); 
const path = require("path");
const indexRouter = require("./routes/index");

const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);

let waitingUsers = [];
let rooms ={};

io.on("connection", function(socket){
    socket.on("joinroom", function(){
        // console.log(socket.id);
        if(waitingUsers.length>0){
            let patner = waitingUsers.shift();
            let roomname = `${socket.id}-${patner.id}`;
            socket.join(roomname);
            patner.join(roomname);

            io.to(roomname).emit("joined", roomname);
        }
        else{
            waitingUsers.push(socket);
        }
    });

    socket.on("signalingMessage", function(data){
        socket.broadcast.to(data.room).emit("signalingMessage", data.message);
        
    });

    socket.on("message", function(data){
        socket.broadcast.to(data.room).emit("message", data.message);
    });

    socket.on("startVideoCall", function({room}){
        socket.broadcast.to(room).emit("incomingCall");
    });

    socket.on("acceptCall", function({room}){
        socket.broadcast.to(room).emit("callAccepted");
    });

    socket.on("rejectCall", function({room}){
        socket.broadcast.to(room).emit("callRejected")
    });

    // socket.on("disconnect", function(){
    //     waitingUsers.indexOf(waitingUsers => waitingUsers.id === socket.id);
    //     waitingUsers.splice(index, 1);
    // })

    socket.on("disconnect", function(){
        const index = waitingUsers.findIndex(user => user.id === socket.id);
        if (index !== -1) {
            waitingUsers.splice(index, 1);
        }
    });
    
});


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

const PORT = process.env.SERVER_PORT || 3000;
 server.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);
 });
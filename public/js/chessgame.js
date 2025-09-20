const socket=io();

socket.emit("joinGame");
socket.on("Kartik",()=>{
    console.log("Kartik");
})
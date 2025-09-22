const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", (uniqueSocket) => {
  console.log("New Connection: " + uniqueSocket.id);

  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerColor", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerColor", "b");
  } else {
    uniqueSocket.emit("spectatorRole");
  }

  uniqueSocket.emit("boardState", chess.fen());

  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
      if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        uniqueSocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.log("Move error:", err);
      uniqueSocket.emit("invalidMove", move);
    }
  });

  uniqueSocket.on("disconnect", () => {
    console.log("Disconnected: " + uniqueSocket.id);
    if (uniqueSocket.id === players.white) delete players.white;
    if (uniqueSocket.id === players.black) delete players.black;
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});

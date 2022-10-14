const PORT = process.env.PORT || 8001;
const ENV = require("./environment");

class Games {
  constructor() {
    this.games = {};
    this.createGame = this.createGame.bind(this);
    this.joinGame = this.joinGame.bind(this);
    this.findGame = this.findGame.bind(this);
  }

  createGame(client) {
    const gameId = Math.floor(Math.random() * 900 + 100);
    this.games.push({
      id: gameId,
      host: client
    });

    return gameId;
  }

  joinGame(client, gameId) {
    const game = this.findGame(gameId);
    if (game) {
      game.guest = client;
      return true;
    }
    return false;
  }

  findGame(id) {
    return this.games.find(game => game.id === id);
  }
}

const games = new Games();

const app = require("./application")(ENV, { updateAppointment }, games);
const server = require("http").Server(app);

const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

// const Clients = require("./clients");
class Clients {
  constructor() {
    this.clientList = {};
    this.saveClient = this.saveClient.bind(this);
  }
  saveClient(name, client) {
    this.clientList[name] = client;
  }
}

const clients = new Clients();

wss.on("connection", socket => {
  socket.onmessage = event => {
    console.log(`Message Received: ${event.data}`);
    clients.saveClient(event.data.username, socket);

    if (event.data.type === "CREATE_GAME") {
      const gameID = games.createGame(socket);
      socket.send(
        JSON.stringify({
          type: "CREATE_GAME",
          gameID
        })
      );
    }

    if (event.data.type === "JOIN_GAME") {
      const success = games.joinGame(socket, event.data.gameID);
      socket.send(
        JSON.stringify({
          type: "JOIN_GAME",
          success
        })
      );
    }

    if (event.data === "ping") {
      socket.send(JSON.stringify("pong"));
    }
  };
});

function updateAppointment(id, interview) {
  wss.clients.forEach(function eachClient(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "SET_INTERVIEW",
          id,
          interview
        })
      );
    }
  });
}

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT} in ${ENV} mode.`);
});

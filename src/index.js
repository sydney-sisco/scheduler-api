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

    this.games[gameId] = {
      id: gameId,
      host: client
    };

    return gameId;
  }

  joinGame(client, gameId) {
    const game = this.games[gameId];
    console.log("game", game);
    if (game) {
      game.guest = client;

      return true;
    }
    return false;
  }

  findGame(id) {
    return this.games[id];
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
    // socket.send(`Message Received: ${event.data}`);
    clients.saveClient(event.data.username, socket);

    try {
      const message = JSON.parse(event.data);
      console.log('message: ', message);

      if (message.type === "CREATE_GAME") {
        console.log("Creating game",);
        const gameId = games.createGame(socket);
        socket.send(
          JSON.stringify({
            type: "CREATE_GAME",
            gameId
          })
        );
      }

      if (message.type === "JOIN_GAME") {
        const success = games.joinGame(socket, message.gameId);
        socket.send(
          JSON.stringify({
            type: "JOIN_GAME",
            success
          })
        );
        if (success) {
          const game = games.findGame(message.gameId);
          game.host.send(
            JSON.stringify({
              type: "GAME_READY",
              gameId: message.gameId
            })
          );
          game.guest.send(
            JSON.stringify({
              type: "GAME_READY",
              gameId: message.gameId
            })
          );
        }
      }

      if (message.type === "SEND_MOVE") {
        const game = games.findGame(message.gameId);
        const players = [game.host, game.guest];
        console.log('sending move to players: ', players);
        players.forEach(player => {
          player.send(
            JSON.stringify({
              type: "MOVE",
              move: message.move,
              gameId: message.gameId
            })
          );
        });

      }

    } catch (e) {
      console.log(e); 
    }
    

    if (event.data === "ping") {
      socket.send(JSON.stringify("pong"));
    }

    if (event.data === "{\"type\":\"ping\"}") {
      socket.send(JSON.stringify("pong object"));
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

function startGame(gameId, game) {
  if (game.host.readyState === WebSocket.OPEN && game.guest.readyState === WebSocket.OPEN) {
    const players = [game.host, game.guest];
    players.forEach(player => {
      player.send(
        JSON.stringify({
          type: "START_GAME",
          gameId,
          game
        })
      );
    });
  }
}

function updateGame(gameId, game) {
  if (game.host.readyState === WebSocket.OPEN && game.guest.readyState === WebSocket.OPEN) {
    const players = [game.host, game.guest];
    players.forEach(player => {
      player.send(
        JSON.stringify({
          type: "UPDATE_GAME",
          gameId,
          game
        })
      );
    });
  }
}

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT} in ${ENV} mode.`);
});

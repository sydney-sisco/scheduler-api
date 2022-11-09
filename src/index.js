const PORT = process.env.PORT || 8001;
const ENV = require("./environment");

class Games {
  constructor() {
    this.games = [];
    this.createGame = this.createGame.bind(this);
    this.joinGame = this.joinGame.bind(this);
    this.findGame = this.findGame.bind(this);
  }

  createGame(nickname, client) {
    // generate a random 3 digit ID for the game
    const gameId = Math.floor(Math.random() * 900 + 100);

    // games are stored in an array
    this.games.push({
      id: gameId,
      host: nickname,
      hostSocket: client,
      guest: null,
      guestSocket: null
    });

    return gameId;
  }

  joinGame(nickname, gameId, client) {
    // convert gameId to a number since it arrives as a string
    const gameIdNumber = Number(gameId);

    // find the game in the array
    const game = this.findGame(gameIdNumber);

    // if the game exists, add the guest to the game
    if (game) {
      game.guest = nickname;
      game.guestSocket = client;

      return game;
    }

    // if the game doesn't exist, return false
    return false;
  }

  findGame(gameId) {
    return this.games.find(game => game.id === gameId);
  }

  findGameBySocket(client) {
    return this.games.find(game => game.hostSocket === client || game.guestSocket === client);
  }

  removeGame(gameId) {
    const gameIndex = this.games.findIndex(game => game.id === gameId);
    this.games.splice(gameIndex, 1);
  }
}

const games = new Games();

const app = require("./application")(ENV, { updateAppointment }, games);
const server = require("http").Server(app);

const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

// const Clients = require("./clients");
// class Clients {
//   constructor() {
//     this.clientList = {};
//     this.saveClient = this.saveClient.bind(this);
//   }
//   saveClient(name, client) {
//     this.clientList[name] = client;
//   }
// }

// const clients = new Clients();

wss.on("connection", socket => {
  socket.onmessage = event => {
    console.log(`Message Received: ${event.data}`);
    // clients.saveClient(event.data.username, socket);

    try {
      const message = JSON.parse(event.data);
      console.log('message: ', message);

      if (message.type === "CREATE_GAME") {
        console.log("Creating game",);
        const gameId = games.createGame(message.nickname, socket);
        console.log("gameId:", gameId);
        socket.send(
          JSON.stringify({
            type: "CREATE_GAME",
            gameId
          })
        );
      }

      if (message.type === "JOIN_GAME") {
        const game = games.joinGame(message.nickname, message.gameId, socket);
        socket.send(
          JSON.stringify({
            type: "JOIN_GAME",
            success: !!game
          })
        );
        if (game) {
          game.hostSocket.send(
            JSON.stringify({
              type: "GAME_READY",
              gameId: game.id
            })
          );
          game.guestSocket.send(
            JSON.stringify({
              type: "GAME_READY",
              gameId: game.id,
            })
          );
        }
      }

      if (message.type === "SEND_MOVE") {
        const game = games.findGame(message.gameId);
        const players = [game.hostSocket, game.guestSocket];
        console.log('sending move to players: ', players);
        players.forEach(player => {
          player.send(
            JSON.stringify({
              type: "MOVE",
              move: message.move,
              gameId: message.gameId // make this game.id
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

  socket.onclose = event => {
    console.log("socket closed", event);

    // remove the client from the list
    // clients.removeClient(socket);

    // if the client was in a game, remove the game
    const game = games.findGameBySocket(socket);
    if (game) {
      games.removeGame(game);
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

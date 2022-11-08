// 
//  THIS FILE IS CURRENTLY UNUSED
//  SEE index.js for the current Games code
// 


// class Games {
//   constructor() {
//     this.games = {};
//     this.createGame = this.createGame.bind(this);
//     this.joinGame = this.joinGame.bind(this);
//     this.findGame = this.findGame.bind(this);
//   }

//   createGame(client) {
//     const gameId = Math.floor(Math.random() * 900 + 100);
//     this.games.push({
//       id: gameId,
//       host: client 
//     });

//     return gameId;
//   }

//   joinGame(client, gameId) {
//     const game = this.findGame(gameId);
//     if (game) {
//       game.guest = client;
//       return true;
//     }
//     return false;
//   }

//   findGame(id) {
//     return this.games.find(game => game.id === id);
//   }
// }

const router = require("express").Router();

module.exports = games => {
  router.get("/games", (request, response) => {
    response.json(games);
  });

  router.get("/games/:id", (request, response) => {
    const game = games.find(game => game.id === Number(request.params.id));
    if (game) {
      response.json(game);
    } else {
      response.status(404).json({});
    }
  });

  return router;
};

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var uniqid = require('uniqid');
const GameService = require('./services/game.service');

// ---------------------------------------------------
// -------- CONSTANTS AND GLOBAL VARIABLES -----------
// ---------------------------------------------------
let games = [];
let queue = [];
let gameInterval = null;

// ------------------------------------
// -------- EMITTER METHODS -----------
// ------------------------------------

const updateClientsViewTimers = (game) => {
  game.player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', game.gameState));
  if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', game.gameState)); }
};

const updateClientsViewDecks = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:1', game.gameState));
    if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:2', game.gameState)); }
  }, 200);
};

const updateClientsViewScores = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.score.view-state', GameService.send.forPlayer.scoresViewState('player:1', game.gameState));
    if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.score.view-state', GameService.send.forPlayer.scoresViewState('player:2', game.gameState)); }
  }, 200);
};

const updateClientsViewTokens = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.tokens.view-state', GameService.send.forPlayer.tokensViewState('player:1', game.gameState));
    if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.tokens.view-state', GameService.send.forPlayer.tokensViewState('player:2', game.gameState)); }
  }, 200);
};

const updateClientsViewChoices = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:1', game.gameState));
    if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:2', game.gameState)); }
  }, 200);
}

const updateClientsViewGrid = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:1', game.gameState));
    if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:2', game.gameState)); }
  }, 200)
}

const updateClientsViewInfos = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.infos.view-state', GameService.send.forPlayer.viewInfosState('player:1', game.gameState));
    if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.infos.view-state', GameService.send.forPlayer.viewInfosState('player:2', game.gameState)); }
  }, 200);
}

const updateClientsViewResult = (game) => {
  setTimeout(() => {
    game.player1Socket.emit('game.result.view-state', GameService.send.forPlayer.viewResultState(game.gameState));
    if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.result.view-state', GameService.send.forPlayer.viewResultState(game.gameState)); }
  }, 200);
}


// ---------------------------------
// -------- GAME METHODS -----------
// ---------------------------------

const createGame = (player1Socket, player2Socket, isVsBotGame) => {

  // init objet (game) with this first level of structure:
  // - gameState : { .. evolutive object .. }
  // - idGame : just in case ;)
  // - player1Socket: socket instance key "joueur:1"
  // - player2Socket: socket instance key "joueur:2"
  const newGame = GameService.init.gameState();
  newGame['idGame'] = uniqid();
  newGame['player1Socket'] = player1Socket;
  newGame['player2Socket'] = player2Socket; 

  games.push(newGame);

  const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);

  games[gameIndex].gameState.isVsBotGame = isVsBotGame;

  games[gameIndex].player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));
  if (!isVsBotGame) { games[gameIndex].player2Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:2', games[gameIndex])); }

  updateClientsViewTimers(games[gameIndex]);
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewScores(games[gameIndex]);
  updateClientsViewTokens(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);
  updateClientsViewInfos(games[gameIndex]);

  gameInterval = setInterval(() => {

    games[gameIndex].gameState.timer--;

    updateClientsViewTimers(games[gameIndex]);

    if (games[gameIndex].gameState.timer === 0) {

      if (!isVsBotGame) { 
        games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1'; 
      }
      else {
        games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'bot' : 'player:1';
      }

      if (games[gameIndex].gameState.currentTurn === 'bot' && isVsBotGame) {
        botPlay(games[gameIndex]);
      }
      
      games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

      games[gameIndex].gameState.deck = GameService.init.deck();
      games[gameIndex].gameState.choices = GameService.init.choices();
      games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);

      updateClientsViewTimers(games[gameIndex]);
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);
      updateClientsViewGrid(games[gameIndex]);
    }

  }, 1000);

  player1Socket.on('disconnect', () => {
    clearInterval(gameInterval);
  });

  !games[gameIndex].gameState.isVsBotGame && player2Socket.on('disconnect', () => {
    clearInterval(gameInterval);
  });
  
};

const newPlayerInQueue = (socket) => {

  queue.push(socket);

  if (queue.length >= 2) {
    const player1Socket = queue.shift();
    const player2Socket = queue.shift();
    createGame(player1Socket, player2Socket, false);
  }
  else {
    socket.emit('queue.added', GameService.send.forPlayer.viewQueueState());
  }
};

const rollDices = (game) => {
  if (game.gameState.deck.rollsCounter < game.gameState.deck.rollsMaximum) {

    game.gameState.deck.dices = GameService.dices.roll(game.gameState.deck.dices);
    game.gameState.deck.rollsCounter++;

  }
  else {

    game.gameState.deck.dices = GameService.dices.roll(game.gameState.deck.dices);
    game.gameState.deck.rollsCounter++;
    game.gameState.deck.dices = GameService.dices.lockEveryDice(game.gameState.deck.dices);

    game.gameState.timer = 5;

  }

  const dices = game.gameState.deck.dices;
  const isDefi = false;
  const isSec = game.gameState.deck.rollsCounter === 2;

  const combinations = GameService.choices.findCombinations(dices, isDefi, isSec);
  game.gameState.choices.availableChoices = combinations;

  updateClientsViewDecks(game);
  updateClientsViewChoices(game);
};

const lockDice = (game, idDice) => {
  const indexDice = GameService.utils.findDiceIndexByDiceId(game.gameState.deck.dices, idDice);

  game.gameState.deck.dices[indexDice].locked = !game.gameState.deck.dices[indexDice].locked;

  updateClientsViewDecks(game);
};

const selectChoice = (game, choiceId) => {
  game.gameState.choices.idSelectedChoice = choiceId;

  game.gameState.grid = GameService.grid.resetcanBeCheckedCells(game.gameState.grid);
  game.gameState.grid = GameService.grid.updateGridAfterSelectingChoice(choiceId, game.gameState.grid);

  updateClientsViewChoices(game);
  updateClientsViewGrid(game);
};

const selectGridCell = (game, cellId, rowIndex, cellIndex) => {
  game.gameState = GameService.tokens.decrementTokens(game.gameState.currentTurn, game.gameState);

  game.gameState.grid = GameService.grid.resetcanBeCheckedCells(game.gameState.grid);
  game.gameState.grid = GameService.grid.selectCell(cellId, rowIndex, cellIndex, game.gameState.currentTurn, game.gameState.grid);

  game.gameState.player1Score = GameService.score.calculateScore('player:1', game.gameState.grid);
  game.gameState.player2Score = GameService.score.calculateScore('player:2', game.gameState.grid);

  game.gameState.timer = GameService.timer.getTurnDuration();
  game.gameState.deck = GameService.init.deck();
  game.gameState.choices = GameService.init.choices();

  game.player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', game.gameState));
  if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', game.gameState)); }

  updateClientsViewDecks(game);
  updateClientsViewScores(game);
  updateClientsViewTokens(game);
  updateClientsViewChoices(game);
  updateClientsViewGrid(game);

  if (!game.gameState.isVsBotGame) { 
    game.gameState.currentTurn = game.gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1'; 
  }
  else {
    game.gameState.currentTurn = game.gameState.currentTurn === 'player:1' ? 'bot' : 'player:1';
  }

  if (game.gameState.currentTurn === 'bot' && game.gameState.isVsBotGame) {
    botPlay(game);
  }
};

const isGameOver = (game) => {
  const player1Won = GameService.grid.fiveTokensInARow('player:1', game.gameState.grid);
  const player2Won = GameService.grid.fiveTokensInARow('player:2', game.gameState.grid);

  if (game.gameState.player1Tokens === 0 || game.gameState.player2Tokens === 0 || player1Won || player2Won) {

    if (game.gameState.player1Score > game.gameState.player2Score || player1Won && !player2Won) {
      game.gameState.winner = 'player:1';
      game.gameState.loser = 'player:2';
    }

    if (game.gameState.player2Score > game.gameState.player1Score || player2Won && !player1Won) {
      game.gameState.winner = 'player:2';
      game.gameState.loser = 'player:1';
    }

    if (game.gameState.player1Score === game.gameState.player2Score || !player1Won && !player2Won) {
      game.gameState.winner = 'draw';
      game.gameState.loser = 'draw';
    }

    if (player1Won || player2Won) {
      game.gameState.victoryCondition = 'line';
    }
    else {
      game.gameState.victoryCondition = 'score';
    }

    updateClientsViewResult(game);
    clearInterval(gameInterval);

    game.player1Socket.emit('game.over', {isGameOver: true});
    if (!game.gameState.isVsBotGame) { game.player2Socket.emit('game.over', {isGameOver: true}); }
  }
};

// ----------------------------------------
// -------- VS BOT GAME METHODS -----------
// ----------------------------------------

const createVsBotGame = (player1Socket) => {
  createGame(player1Socket, '', true);
};

const botPlay = (game) => {
  console.log('bot is playing');
};

// ---------------------------------------
// -------- SOCKETS MANAGEMENT -----------
// ---------------------------------------

io.on('connection', socket => {
  console.log(`[${socket.id}] socket connected`);

  socket.on('queue.join', () => {
    console.log(`[${socket.id}] new player in queue `)
    newPlayerInQueue(socket);
  });

  socket.on('game.vs-bot.start', () => {
    console.log(`[${socket.id}] game vs bot started `)
    createVsBotGame(socket);
  });

  socket.on('game.dices.roll', () => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    rollDices(games[gameIndex]);
  });

  socket.on('game.dices.lock', (idDice) => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    lockDice(games[gameIndex], idDice);
  });

  socket.on('game.choices.selected', (data) => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    selectChoice(games[gameIndex], data.choiceId)
  });

  socket.on('game.grid.selected', (data) => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    selectGridCell(games[gameIndex], data.cellId, data.rowIndex, data.cellIndex);

    isGameOver(games[gameIndex])
  });

  socket.on('game.close', () => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    games = games.filter(game => game.idGame !== (games[gameIndex].idGame) ? games[gameIndex].idGame : null);
  });

  socket.on('disconnect', reason => {
    console.log(`[${socket.id}] socket disconnected - ${reason}`);
  });
});

// -----------------------------------
// -------- SERVER METHODS -----------
// -----------------------------------

app.get('/', (req, res) => res.sendFile('index.html'));

http.listen(3000, function () {
  console.log('listening on *:3000');
});

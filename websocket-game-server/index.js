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

  // push game into 'games' global array
  games.push(newGame);

  const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);

  games[gameIndex].gameState.isVsBotGame = isVsBotGame;

  // just notifying screens that game is starting
  games[gameIndex].player1Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]));
  if (!isVsBotGame) { games[gameIndex].player2Socket.emit('game.start', GameService.send.forPlayer.viewGameState('player:2', games[gameIndex])); }

  // we update views
  updateClientsViewTimers(games[gameIndex]);
  updateClientsViewDecks(games[gameIndex]);
  updateClientsViewScores(games[gameIndex]);
  updateClientsViewTokens(games[gameIndex]);
  updateClientsViewGrid(games[gameIndex]);
  updateClientsViewInfos(games[gameIndex]);

  // timer every second
  gameInterval = setInterval(() => {

    // timer variable decreased
    games[gameIndex].gameState.timer--;

    // emit timer to both clients every seconds
    updateClientsViewTimers(games[gameIndex]);

    // if timer is down to 0, we end turn
    if (games[gameIndex].gameState.timer === 0) {

      // switch currentTurn variable
      if (!isVsBotGame) { 
        games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1'; 
      }
      else {
        games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'bot' : 'player:1';
      }

      if (games[gameIndex].gameState.currentTurn === 'bot' && isVsBotGame) {
        botPlay(games[gameIndex]);
      }
      
      // reset timer
      games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();

      // reset deck / choices / grid states
      games[gameIndex].gameState.deck = GameService.init.deck();
      games[gameIndex].gameState.choices = GameService.init.choices();
      games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);

      // reset views also
      updateClientsViewTimers(games[gameIndex]);
      updateClientsViewDecks(games[gameIndex]);
      updateClientsViewChoices(games[gameIndex]);
      updateClientsViewGrid(games[gameIndex]);
    }

  }, 1000);

  // remove intervals at deconnection
  player1Socket.on('disconnect', () => {
    clearInterval(gameInterval);
  });

  
  !games[gameIndex].gameState.isVsBotGame && player2Socket.on('disconnect', () => {
    clearInterval(gameInterval);
  });
  
};

const newPlayerInQueue = (socket) => {

  queue.push(socket);

  // 'queue' management
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
  // if not last throw
  if (game.gameState.deck.rollsCounter < game.gameState.deck.rollsMaximum) {

    // dices management
    game.gameState.deck.dices = GameService.dices.roll(game.gameState.deck.dices);
    game.gameState.deck.rollsCounter++;

  }
  // if last throw
  else {

    // dices management 
    game.gameState.deck.dices = GameService.dices.roll(game.gameState.deck.dices);
    game.gameState.deck.rollsCounter++;
    game.gameState.deck.dices = GameService.dices.lockEveryDice(game.gameState.deck.dices);

    // temporary put timer at 5 sec to test turn switching 
    game.gameState.timer = 5;
  }

  // combinations management
  const dices = game.gameState.deck.dices;
  const isDefi = false;
  const isSec = game.gameState.deck.rollsCounter === 2;

  const combinations = GameService.choices.findCombinations(dices, isDefi, isSec);
  game.gameState.choices.availableChoices = combinations;


  // emit to views new state
  updateClientsViewDecks(game);
  updateClientsViewChoices(game);
};

const lockDice = (game, idDice) => {
  const indexDice = GameService.utils.findDiceIndexByDiceId(game.gameState.deck.dices, idDice);

  // reverse flag 'locked'
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

    // Here we decrement the number of tokens left
    games[gameIndex].gameState = GameService.tokens.decrementTokens(games[gameIndex].gameState.currentTurn, games[gameIndex].gameState);

    // Here we select the cell
    games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
    games[gameIndex].gameState.grid = GameService.grid.selectCell(data.cellId, data.rowIndex, data.cellIndex, games[gameIndex].gameState.currentTurn, games[gameIndex].gameState.grid);

    // Here calcul score
    games[gameIndex].gameState.player1Score = GameService.score.calculateScore('player:1', games[gameIndex].gameState.grid);
    games[gameIndex].gameState.player2Score = GameService.score.calculateScore('player:2', games[gameIndex].gameState.grid);

    games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
    games[gameIndex].gameState.deck = GameService.init.deck();
    games[gameIndex].gameState.choices = GameService.init.choices();

    games[gameIndex].player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', games[gameIndex].gameState));
    if (!games[gameIndex].gameState.isVsBotGame) { games[gameIndex].player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', games[gameIndex].gameState)); }

    updateClientsViewDecks(games[gameIndex]);
    updateClientsViewScores(games[gameIndex]);
    updateClientsViewTokens(games[gameIndex]);
    updateClientsViewChoices(games[gameIndex]);
    updateClientsViewGrid(games[gameIndex]);

    // Here we check if game is over
    const player1Won = GameService.grid.fiveTokensInARow('player:1', games[gameIndex].gameState.grid);
    const player2Won = GameService.grid.fiveTokensInARow('player:2', games[gameIndex].gameState.grid);

    if (games[gameIndex].gameState.player1Tokens === 0 || games[gameIndex].gameState.player2Tokens === 0 || player1Won || player2Won) {

      if (games[gameIndex].gameState.player1Score > games[gameIndex].gameState.player2Score || player1Won && !player2Won) {
        games[gameIndex].gameState.winner = 'player:1';
        games[gameIndex].gameState.loser = 'player:2';
      }

      if (games[gameIndex].gameState.player2Score > games[gameIndex].gameState.player1Score || player2Won && !player1Won) {
        games[gameIndex].gameState.winner = 'player:2';
        games[gameIndex].gameState.loser = 'player:1';
      }

      if (games[gameIndex].gameState.player1Score === games[gameIndex].gameState.player2Score || !player1Won && !player2Won) {
        games[gameIndex].gameState.winner = 'draw';
        games[gameIndex].gameState.loser = 'draw';
      }

      if (player1Won || player2Won) {
        games[gameIndex].gameState.victoryCondition = 'line';
      }
      else {
        games[gameIndex].gameState.victoryCondition = 'score';
      }

      updateClientsViewResult(games[gameIndex]);
      clearInterval(gameInterval);

      // change the screen to game over
      games[gameIndex].player1Socket.emit('game.over', {isGameOver: true});
      if (!games[gameIndex].gameState.isVsBotGame) { games[gameIndex].player2Socket.emit('game.over', {isGameOver: true}); }
    }

    if (!games[gameIndex].gameState.isVsBotGame) { 
      games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1'; 
    }
    else {
      games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'bot' : 'player:1';
    }

    if (games[gameIndex].gameState.currentTurn === 'bot' && games[gameIndex].gameState.isVsBotGame) {
      botPlay(games[gameIndex]);
    }
  });

  socket.on('game.close', () => {
    const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
    games = games.filter(game => game.idGame !== games[gameIndex].idGame);
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

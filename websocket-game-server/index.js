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

  // toggle dice lock state and unlock state
  game.gameState.deck.dices[indexDice].locked = !game.gameState.deck.dices[indexDice].locked;

  updateClientsViewDecks(game);
};

const selectChoice = (game, choiceId) => {
  console.log('choiceId', choiceId);
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

  isGameOver(game);
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
  createGame(player1Socket, 'bot', true);
};

// const ALL_COMBINATIONS = [
//   { id: 'brelan1', weights: 0.76852 },
//   { id: 'brelan2', weights: 0.76852 },
//   { id: 'brelan3', weights: 0.76852 },
//   { id: 'brelan4', weights: 0.76852 },
//   { id: 'brelan5', weights: 0.76852 },
//   { id: 'brelan6', weights: 0.76852 },
//   { id: 'moinshuit', weights: 0.787 },
//   { id: 'suite', weights: 0.90741 },
//   { id: 'sec', weights: 0.90741 },
//   { id: 'full', weights: 0.94733 },
//   { id: 'carre', weights: 0.96142 },
//   { id: 'yam', weights: 0.99923 },
//   { id: 'defi', weights: 0 }
// ];

// const ALL_BRELAN1_COMBINATIONS = [
//   [1, 1, 1, 2, 3], [1, 1, 1, 2, 4], [1, 1, 1, 2, 5], [1, 1, 1, 2, 6], [1, 1, 1, 3, 4], 
//   [1, 1, 1, 3, 5], [1, 1, 1, 3, 6], [1, 1, 1, 4, 5], [1, 1, 1, 4, 6], [1, 1, 1, 5, 6]
// ];

// const ALL_BRELAN2_COMBINATIONS = [
//   [2, 2, 2, 1, 3], [2, 2, 2, 1, 4], [2, 2, 2, 1, 5], [2, 2, 2, 1, 6], [2, 2, 2, 3, 4],
//   [2, 2, 2, 3, 5], [2, 2, 2, 3, 6], [2, 2, 2, 4, 5], [2, 2, 2, 4, 6], [2, 2, 2, 5, 6]
// ];

// const ALL_BRELAN3_COMBINATIONS = [
//   [3, 3, 3, 1, 2], [3, 3, 3, 1, 4], [3, 3, 3, 1, 5], [3, 3, 3, 1, 6], [3, 3, 3, 2, 4],
//   [3, 3, 3, 2, 5], [3, 3, 3, 2, 6], [3, 3, 3, 4, 5], [3, 3, 3, 4, 6], [3, 3, 3, 5, 6]
// ];

// const ALL_BRELAN4_COMBINATIONS = [
//   [4, 4, 4, 1, 2], [4, 4, 4, 1, 3], [4, 4, 4, 1, 5], [4, 4, 4, 1, 6], [4, 4, 4, 2, 3],
//   [4, 4, 4, 2, 5], [4, 4, 4, 2, 6], [4, 4, 4, 3, 5], [4, 4, 4, 3, 6], [4, 4, 4, 5, 6]
// ];

// const ALL_BRELAN5_COMBINATIONS = [
//   [5, 5, 5, 1, 2], [5, 5, 5, 1, 3], [5, 5, 5, 1, 4], [5, 5, 5, 1, 6], [5, 5, 5, 2, 3],
//   [5, 5, 5, 2, 4], [5, 5, 5, 2, 6], [5, 5, 5, 3, 4], [5, 5, 5, 3, 6], [5, 5, 5, 4, 6]
// ];

// const ALL_BRELAN6_COMBINATIONS = [
//   [6, 6, 6, 1, 2], [6, 6, 6, 1, 3], [6, 6, 6, 1, 4], [6, 6, 6, 1, 5], [6, 6, 6, 2, 3],
//   [6, 6, 6, 2, 4], [6, 6, 6, 2, 5], [6, 6, 6, 3, 4], [6, 6, 6, 3, 5], [6, 6, 6, 4, 5]
// ];

// const ALL_FULL_COMBINATIONS = [
//   [1, 1, 1, 2, 2], [1, 1, 1, 3, 3], [1, 1, 1, 4, 4], [1, 1, 1, 5, 5], [1, 1, 1, 6, 6],
//   [2, 2, 2, 1, 1], [2, 2, 2, 3, 3], [2, 2, 2, 4, 4], [2, 2, 2, 5, 5], [2, 2, 2, 6, 6],
//   [3, 3, 3, 1, 1], [3, 3, 3, 2, 2], [3, 3, 3, 4, 4], [3, 3, 3, 5, 5], [3, 3, 3, 6, 6],
//   [4, 4, 4, 1, 1], [4, 4, 4, 2, 2], [4, 4, 4, 3, 3], [4, 4, 4, 5, 5], [4, 4, 4, 6, 6],
//   [5, 5, 5, 1, 1], [5, 5, 5, 2, 2], [5, 5, 5, 3, 3], [5, 5, 5, 4, 4], [5, 5, 5, 6, 6],
//   [6, 6, 6, 1, 1], [6, 6, 6, 2, 2], [6, 6, 6, 3, 3], [6, 6, 6, 4, 4], [6, 6, 6, 5, 5]
// ];

// const ALL_CARRE_COMBINATIONS = [
//   [1, 1, 1, 1, 2], [1, 1, 1, 1, 3], [1, 1, 1, 1, 4], [1, 1, 1, 1, 5], [1, 1, 1, 1, 6],
//   [2, 2, 2, 2, 1], [2, 2, 2, 2, 3], [2, 2, 2, 2, 4], [2, 2, 2, 2, 5], [2, 2, 2, 2, 6],
//   [3, 3, 3, 3, 1], [3, 3, 3, 3, 2], [3, 3, 3, 3, 4], [3, 3, 3, 3, 5], [3, 3, 3, 3, 6],
//   [4, 4, 4, 4, 1], [4, 4, 4, 4, 2], [4, 4, 4, 4, 3], [4, 4, 4, 4, 5], [4, 4, 4, 4, 6],
//   [5, 5, 5, 5, 1], [5, 5, 5, 5, 2], [5, 5, 5, 5, 3], [5, 5, 5, 5, 4], [5, 5, 5, 5, 6],
//   [6, 6, 6, 6, 1], [6, 6, 6, 6, 2], [6, 6, 6, 6, 3], [6, 6, 6, 6, 4], [6, 6, 6, 6, 5]
// ];

// const ALL_YAM_COMBINATIONS = [
//   [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [3, 3, 3, 3, 3], [4, 4, 4, 4, 4], [5, 5, 5, 5, 5], [6, 6, 6, 6, 6]
// ];  

// const ALL_SUITE_COMBINATIONS = [
//   [1, 2, 3, 4, 5], [2, 3, 4, 5, 6]
// ];

// const ALL_MOINSHUIT_COMBINATIONS = [
//   [1, 1, 1, 1, 1], [1, 1, 1, 1, 2], [1, 1, 1, 1, 3], [1, 1, 1, 1, 4],
//   [1, 1, 1, 2, 2], [1, 1, 1, 2, 3], [1, 1, 2, 2, 2,]
// ];

// let grid_weights = [
//   [1.0, 1.0, 0.0, 1.0, 1.0],
//   [1.0, 1.5, 1.3, 1.4, 1.0],
//   [1.2, 1.4, 1.6, 0.0, 1.3],
//   [1.0, 1.3, 1.3, 1.2, 1.0],
//   [1.0, 1.0, 1.5, 1.0, 1.0]
// ]

// const updateGrideWeights = (game) => {
//   let current_matrix = GameService.grid.getMatrix(game.gameState.grid);

//   for (let i = 0; i < 5; i++) {
//     for (let j = 0; j < 5; j++) {
//       grid_weights[i][j] = current_matrix[i][j] * grid_weights[i][j];
//     }
//   }

//   TODO: update grid_weights with the current game state
// };

// const findBestMove = (game) => {

//   TODO: find the algorithm to compare combinaisons and grid_weights

// };

const botPlay = (game) => {
  // rollDices(game);

  // updateGrideWeights(game);

  // findBestMove(game);

  setTimeout(() => {
    rollDices(game);

    setTimeout(() => {
      lockDice(game, 2);

      setTimeout(() => {
        rollDices(game);

        setTimeout(() => {
          lockDice(game, 1);

          setTimeout(() => {
            rollDices(game);

            setTimeout(() => {
              if(typeof game.gameState.choices.availableChoices[0] !== "undefined") {
                selectChoice(game, game.gameState.choices.availableChoices[0].id);

                setTimeout(() => {
                  switch(game.gameState.choices.availableChoices[0].id) {

                    case 'brelan1':
                      if (game.gameState.grid[0][0].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[0][0].id, 0, 0);
                      } else {
                        if (game.gameState.grid[3][4].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[3][4].id, 3, 4);
                        }
                      }
                      break;

                    case 'brelan2':
                      if (game.gameState.grid[1][0].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[1][0].id, 1, 0);
                      } else {
                        if (game.gameState.grid[4][1].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[4][1].id, 4, 1);
                        }
                      }
                      break;

                    case 'brelan3':
                      if (game.gameState.grid[0][1].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[0][1].id, 0, 1);
                      } else {
                        if (game.gameState.grid[4][0].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[4][0].id, 4, 0);
                        }
                      }
                      break;

                    case 'brelan4':
                      if (game.gameState.grid[0][3].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[0][3].id, 0, 3);
                      } else {
                        if (game.gameState.grid[4][4].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[4][4].id, 4, 4);
                        }
                      }
                      break;

                    case 'brelan5':
                      if (game.gameState.grid[1][4].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[1][4].id, 1, 4);
                      } else {
                        if (game.gameState.grid[4][3].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[4][3].id, 4, 3);
                        }
                      }
                      break;

                    case 'brelan6':
                      if (game.gameState.grid[0][4].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[0][4].id, 0, 4);
                      } else {
                        if (game.gameState.grid[3][0].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[3][0].id, 3, 0);
                        }
                      }
                      break;

                    case 'moinshuit':
                      if (game.gameState.grid[2][0].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[2][0].id, 2, 0);
                      } else {
                        if (game.gameState.grid[3][3].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[3][3].id, 3, 3);
                        }
                      }
                      break;

                    case 'suite':
                      if (game.gameState.grid[2][4].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[2][4].id, 2, 4);
                      } else {
                        if (game.gameState.grid[3][2].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[3][2].id, 3, 2);
                        }
                      }
                      break;

                    case 'sec':
                      if (game.gameState.grid[1][2].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[1][2].id, 1, 2);
                      } else {
                        if (game.gameState.grid[3][1].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[3][1].id, 3, 1);
                        }
                      }
                      break;

                    case 'full':
                      if (game.gameState.grid[1][3].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[1][3].id, 1, 3);
                      } else {
                        if (game.gameState.grid[2][1].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[2][1].id, 2, 1);
                        }
                      }
                      break;

                    case 'carre':
                      if (game.gameState.grid[1][1].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[1][1].id, 1, 1);
                      } else {
                        if (game.gameState.grid[4][2].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[4][2].id, 4, 2);
                        }
                      }
                      break;

                    case 'yam':
                      if (game.gameState.grid[2][2].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[2][2].id, 2, 2);
                      } 
                      break;

                    case 'defi':
                      if (game.gameState.grid[0][2].canBeChecked) {
                        selectGridCell(game, game.gameState.grid[0][2].id, 0, 2);
                      } else {
                        if (game.gameState.grid[2][3].canBeChecked) {
                          selectGridCell(game, game.gameState.grid[2][3].id, 2, 3);
                        }
                      }
                      break;

                    default:
                      break;
                  }
                }, 1000);
              }
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);

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

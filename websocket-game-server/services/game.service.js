const TURN_DURATION = 30;
const MAX_ROLLS = 3;
const MAX_TOKENS = 12;

const DECK_INIT = {
    dices: [
        { id: 1, value: '', locked: true },
        { id: 2, value: '', locked: true },
        { id: 3, value: '', locked: true },
        { id: 4, value: '', locked: true },
        { id: 5, value: '', locked: true },
    ],
    rollsCounter: 1,
    rollsMaximum: MAX_ROLLS
};

const CHOICES_INIT = {
    isDefi: false,
    isSec: false,
    idSelectedChoice: null,
    availableChoices: [],
};

const GRID_INIT = [
    [
        { viewContent: '1', id: 'brelan1', owner: null, canBeChecked: false },
        { viewContent: '3', id: 'brelan3', owner: null, canBeChecked: false },
        { viewContent: 'Défi', id: 'defi', owner: null, canBeChecked: false },
        { viewContent: '4', id: 'brelan4', owner: null, canBeChecked: false },
        { viewContent: '6', id: 'brelan6', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '2', id: 'brelan2', owner: null, canBeChecked: false },
        { viewContent: 'Carré', id: 'carre', owner: null, canBeChecked: false },
        { viewContent: 'Sec', id: 'sec', owner: null, canBeChecked: false },
        { viewContent: 'Full', id: 'full', owner: null, canBeChecked: false },
        { viewContent: '5', id: 'brelan5', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '≤8', id: 'moinshuit', owner: null, canBeChecked: false },
        { viewContent: 'Full', id: 'full', owner: null, canBeChecked: false },
        { viewContent: 'Yam', id: 'yam', owner: null, canBeChecked: false },
        { viewContent: 'Défi', id: 'defi', owner: null, canBeChecked: false },
        { viewContent: 'Suite', id: 'suite', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '6', id: 'brelan6', owner: null, canBeChecked: false },
        { viewContent: 'Sec', id: 'sec', owner: null, canBeChecked: false },
        { viewContent: 'Suite', id: 'suite', owner: null, canBeChecked: false },
        { viewContent: '≤8', id: 'moinshuit', owner: null, canBeChecked: false },
        { viewContent: '1', id: 'brelan1', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '3', id: 'brelan3', owner: null, canBeChecked: false },
        { viewContent: '2', id: 'brelan2', owner: null, canBeChecked: false },
        { viewContent: 'Carré', id: 'carre', owner: null, canBeChecked: false },
        { viewContent: '5', id: 'brelan5', owner: null, canBeChecked: false },
        { viewContent: '4', id: 'brelan4', owner: null, canBeChecked: false },
    ]
];

const ALL_COMBINATIONS = [
    { value: 'Brelan1', id: 'brelan1' },
    { value: 'Brelan2', id: 'brelan2' },
    { value: 'Brelan3', id: 'brelan3' },
    { value: 'Brelan4', id: 'brelan4' },
    { value: 'Brelan5', id: 'brelan5' },
    { value: 'Brelan6', id: 'brelan6' },
    { value: 'Full', id: 'full' },
    { value: 'Carré', id: 'carre' },
    { value: 'Yam', id: 'yam' },
    { value: 'Suite', id: 'suite' },
    { value: '≤8', id: 'moinshuit' },
    { value: 'Sec', id: 'sec' },
    { value: 'Défi', id: 'defi' }
];

const GAME_INIT = {
    gameState: {
        currentTurn: 'player:1',
        timer: null,
        player1Score: 0,
        player2Score: 0,
        player1Tokens: MAX_TOKENS,
        player2Tokens: MAX_TOKENS,
        choices: {},
        deck: {},
        winner: null,
        loser: null,
        victoryCondition: null,
        isVsBotGame: null
    }
}

const GameService = {

    init: {
        gameState: () => {
            const game = { ...GAME_INIT };
            game['gameState']['timer'] = TURN_DURATION;
            game['gameState']['deck'] = { ...DECK_INIT };
            game['gameState']['choices'] = { ...CHOICES_INIT };
            game['gameState']['grid'] = [ ...GRID_INIT];
            return game;
        },

        deck: () => {
            return { ...DECK_INIT };
        },

        choices: () => {
            return { ...CHOICES_INIT };
        },

        grid: () => {
            return [ ...GRID_INIT];
        }
    },

    send: {
        forPlayer: {
            viewGameState: (playerKey, game) => {
                return {
                    inQueue: false,
                    inGame: true,
                    idPlayer: (game.gameState.isVsBotGame) ? game.player1Socket.id  :  (playerKey === 'player:1') ? game.player1Socket.id : game.player2Socket.id ,
                    idOpponent: (game.gameState.isVsBotGame) ? 'bot' : (playerKey === 'player:1') ? game.player2Socket.id : game.player1Socket.id
                };
            },

            viewQueueState: () => {
                return {
                    inQueue: true,
                    inGame: false,
                };
            },

            gameTimer: (playerKey, gameState) => {
                const playerTimer = gameState.currentTurn === playerKey ? gameState.timer : 0;
                const opponentTimer = gameState.currentTurn === playerKey ? 0 : gameState.timer;
                return { playerTimer: playerTimer, opponentTimer: opponentTimer };
            },

            deckViewState: (playerKey, gameState) => {
                const deckViewState = {
                    displayPlayerDeck: gameState.currentTurn === playerKey,
                    displayOpponentDeck: gameState.currentTurn !== playerKey,
                    displayRollButton: gameState.deck.rollsCounter <= gameState.deck.rollsMaximum,
                    rollsCounter: gameState.deck.rollsCounter,
                    rollsMaximum: gameState.deck.rollsMaximum,
                    dices: gameState.deck.dices
                };
                return deckViewState;
            },

            scoresViewState: (playerKey, gameState) => {
                const scoresViewState = {
                    playerScore: playerKey === 'player:1' ? gameState.player1Score : gameState.player2Score,
                    opponentScore: playerKey === 'player:1' ? gameState.player2Score : gameState.player1Score
                };
                return scoresViewState;
            },

            tokensViewState: (playerKey, gameState) => {
                const tokensViewState = {
                    playerTokens: playerKey === 'player:1' ? gameState.player1Tokens : gameState.player2Tokens,
                    opponentTokens: playerKey === 'player:1' ? gameState.player2Tokens : gameState.player1Tokens
                };
                return tokensViewState;
            },

            choicesViewState: (playerKey, gameState) => {
                const choicesViewState = {
                    displayChoices: true,
                    canMakeChoice: playerKey === gameState.currentTurn,
                    idSelectedChoice: gameState.choices.idSelectedChoice,
                    availableChoices: gameState.choices.availableChoices,
                    currentTurn: gameState.currentTurn
                }
                return choicesViewState;
            },

            gridViewState: (playerKey, gameState) => {
                const gridViewState = {
                    displayGrid: true,
                    canSelectCells: (playerKey === gameState.currentTurn) && (gameState.choices.availableChoices.length > 0),
                    grid: gameState.grid
                };
                return gridViewState;
            },

            viewInfosState: (playerKey, gameState) => {
                const viewInfosState = {
                    playerInfos: playerKey,
                    opponentInfos: gameState.isVsBotGame ? 'bot' : (playerKey === 'player:1') ? 'player:2' : 'player:1',
                };
                return viewInfosState;
            },

            viewResultState: (gameState) => {
                const viewResultState = {
                    winner: gameState.winner,
                    loser: gameState.loser,
                    victoryCondition: gameState.victoryCondition
                };
                return viewResultState;
            }
                
        }
    },

    score: {
        calculateScore: (playerKey, grid) => {
            let score = 0;

            // Check horizontal
            for (let i = 0; i < 5; i++) {
                let count = 0;
                for (let j = 0; j < 5; j++) {
                    if (grid[i][j].owner === playerKey) {
                        count++;
                    } else {
                        count = 0;
                    }
                    if (count === 3) {
                        score += 1;
                    } else if (count === 4) {
                        score += 1;
                    }
                }
            }

            // Check vertical
            for (let i = 0; i < 5; i++) {
                let count = 0;
                for (let j = 0; j < 5; j++) {
                    if (grid[j][i].owner === playerKey) {
                        count++;
                    } else {
                        count = 0;
                    }
                    if (count === 3) {
                        score += 1;
                    } else if (count === 4) {
                        score += 1;
                    }
                }
            }

            // Check diagonal
            for (let i = 0; i < 5; i++) {
                let count = 0;
                for (let j = 0; j < 5; j++) {
                    if (grid[j][j].owner === playerKey) {
                        count++;
                    } else {
                        count = 0;
                    }
                    if (count === 3) {
                        score += 1;
                    } else if (count === 4) {
                        score += 1;
                    }
                }
            }

            for (let i = 0; i < 5; i++) {
                let count = 0;
                for (let j = 0; j < 5; j++) {
                    if (grid[j][4 - j].owner === playerKey) {
                        count++;
                    } else {
                        count = 0;
                    }
                    if (count === 3) {
                        score += 1;
                    } else if (count === 4) {
                        score += 1;
                    }
                }
            }

            return score;
        }
    },

    tokens: {
        decrementTokens: (playerKey, gameState) => {
            const updatedGameState = { ...gameState };
            if (playerKey === 'player:1') {
                updatedGameState.player1Tokens -= 1;
            } else {
                updatedGameState.player2Tokens -= 1;
            }
            return updatedGameState;
        },

        isTokenAvailable: (playerKey, gameState) => {
            if (playerKey === 'player:1') {
                return gameState.player1Tokens > 0;
            } else {
                return gameState.player2Tokens > 0;
            }
        },

        getTokens: (gameState) => {
            return {
                player1Token: gameState.player1Tokens,
                player2Token: gameState.player2Tokens
            };
        }
    },

    timer: {  
        getTurnDuration: () => {
            return TURN_DURATION;
        }
    },

    dices: {
        roll: (dicesToRoll) => {
            const rolledDices = dicesToRoll.map(dice => {
                if (dice.value === "") {
                    // Si la valeur du dé est vide, alors on le lance en mettant le flag locked à false
                    const newValue = String(Math.floor(Math.random() * 6) + 1); // Convertir la valeur en chaîne de caractères
                    return {
                        id: dice.id,
                        value: newValue,
                        locked: false
                    };
                } else if (!dice.locked) {
                    // Si le dé n'est pas verrouillé et possède déjà une valeur, alors on le relance
                    const newValue = String(Math.floor(Math.random() * 6) + 1);
                    return {
                        ...dice,
                        value: newValue
                    };
                } else {
                    // Si le dé est verrouillé ou a déjà une valeur mais le flag locked est true, on le laisse tel quel
                    return dice;
                }
            });
            return rolledDices;
        },

        lockEveryDice: (dicesToLock) => {
            const lockedDices = dicesToLock.map(dice => ({
                ...dice,
                locked: true // Verrouille chaque dé
            }));
            return lockedDices;
        },

        getMaxReRolls: () => {
            return MAX_ROLLS;
        }
    },

    choices: {
        findCombinations: (dices, isDefi, isSec) => {
            const availableCombinations = [];
            const allCombinations = ALL_COMBINATIONS;

            const counts = Array(7).fill(0); // Tableau pour compter le nombre de dés de chaque valeur (de 1 à 6)
            let hasPair = false; // Pour vérifier si une paire est présente
            let threeOfAKindValue = null; // Stocker la valeur du brelan
            let hasThreeOfAKind = false; // Pour vérifier si un brelan est présent
            let hasFourOfAKind = false; // Pour vérifier si un carré est présent
            let hasFiveOfAKind = false; // Pour vérifier si un Yam est présent
            let hasStraight = false; // Pour vérifier si une suite est présente
            let sum = 0; // Somme des valeurs des dés

            // Compter le nombre de dés de chaque valeur et calculer la somme
            for (let i = 0; i < dices.length; i++) {
                const diceValue = parseInt(dices[i].value);
                counts[diceValue]++;
                sum += diceValue;
            }

            // Vérifier les combinaisons possibles
            for (let i = 1; i <= 6; i++) {
                if (counts[i] === 2) {
                    hasPair = true;
                } else if (counts[i] === 3) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                } else if (counts[i] === 4) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                    hasFourOfAKind = true;
                } else if (counts[i] === 5) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                    hasFourOfAKind = true;
                    hasFiveOfAKind = true;
                }
            }

            const sortedValues = dices.map(dice => parseInt(dice.value)).sort((a, b) => a - b); // Trie les valeurs de dé

            // Vérifie si les valeurs triées forment une suite
            hasStraight = sortedValues.every((value, index) => index === 0 || value === sortedValues[index - 1] + 1);

            // Vérifier si la somme ne dépasse pas 8
            const isLessThanEqual8 = sum <= 8;

            // Retourner les combinaisons possibles via leur ID
            allCombinations.forEach(combination => {
                if (
                    (combination.id.includes('brelan') && hasThreeOfAKind && parseInt(combination.id.slice(-1)) === threeOfAKindValue) ||
                    (combination.id === 'full' && hasPair && hasThreeOfAKind) ||
                    (combination.id === 'carre' && hasFourOfAKind) ||
                    (combination.id === 'yam' && hasFiveOfAKind) ||
                    (combination.id === 'suite' && hasStraight) ||
                    (combination.id === 'moinshuit' && isLessThanEqual8) ||
                    (combination.id === 'defi' && isDefi)
                ) {
                    availableCombinations.push(combination);
                }
            });

            const notOnlyBrelan = availableCombinations.some(combination => !combination.id.includes('brelan'));

            if (isSec && availableCombinations.length > 0 && notOnlyBrelan) {
                availableCombinations.push(allCombinations.find(combination => combination.id === 'sec'));
            }

            return availableCombinations;
        }
    },

    grid: {
        resetcanBeCheckedCells: (grid) => {
            const updatedGrid = grid.map(row => row.map(cell => {
                return { ...cell, canBeChecked: false };    
            }));

            return updatedGrid;
        },

        updateGridAfterSelectingChoice: (idSelectedChoice, grid) => {
            const updatedGrid = grid.map(row => row.map(cell => {
                if (cell.id === idSelectedChoice && cell.owner === null) {
                    return { ...cell, canBeChecked: true };
                } else {
                    return cell;
                }
            }));

            return updatedGrid;
        },

        selectCell: (idCell, rowIndex, cellIndex, currentTurn, grid) => {
            const updatedGrid = grid.map((row, rowIndexParsing) => row.map((cell, cellIndexParsing) => {
                if ((cell.id === idCell) && (rowIndexParsing === rowIndex) && (cellIndexParsing === cellIndex)) {
                    return { ...cell, owner: currentTurn };
                } else {
                    return cell;
                }
            }));
        
            return updatedGrid;
        },

        fiveTokensInARow: (playerKey, grid) => {
            // Check horizontal
            for (let i = 0; i < 5; i++) {
                let count = 0;
                for (let j = 0; j < 5; j++) {
                    if (grid[i][j].owner === playerKey) {
                        count++;
                    } else {
                        count = 0;
                    }
                    if (count === 5) {
                        return true;
                    }
                }
            }

            // Check vertical
            for (let i = 0; i < 5; i++) {
                let count = 0;
                for (let j = 0; j < 5; j++) {
                    if (grid[j][i].owner === playerKey) {
                        count++;
                    } else {
                        count = 0;
                    }
                    if (count === 5) {
                        return true;
                    }
                }
            }

            // Check diagonal
            for (let i = 0; i < 5; i++) {
                let count = 0;
                for (let j = 0; j < 5; j++) {
                    if (grid[j][j].owner === playerKey) {
                        count++;
                    } else {
                        count = 0;
                    }
                    if (count === 5) {
                        return true;
                    }
                }
            }

            for (let i = 0; i < 5; i++) {
                let count = 0;
                for (let j = 0; j < 5; j++) {
                    if (grid[j][4 - j].owner === playerKey) {
                        count++;
                    } else {
                        count = 0;
                    }
                    if (count === 5) {
                        return true;
                    }
                }
            }

            return false;
        },

        getMatrix: (grid) => {
            let matrix = [[], [], [], [], []];

            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    matrix[i][j] = (grid[i][j].owner === null) ? 1 : 0;
                }
            }

            return matrix;
        }
    },

    utils: {
        // Return game index in global games array by id
        findGameIndexById: (games, idGame) => {
            for (let i = 0; i < games.length; i++) {
                if (games[i].idGame === idGame) {
                    return i; // Retourne l'index du jeu si le socket est trouvé
                }
            }
            return -1;
        },

        findGameIndexBySocketId: (games, socketId) => {
            for (let i = 0; i < games.length; i++) {
                if (games[i].player1Socket.id === socketId || (!games.isVsBotGame && games[i].player2Socket.id === socketId)) {
                    return i; // Retourne l'index du jeu si le socket est trouvé
                }
            }
            return -1;
        },

        findDiceIndexByDiceId: (dices, idDice) => {
            for (let i = 0; i < dices.length; i++) {
                if (dices[i].id === idDice) {
                    return i; // Retourne l'index du jeu si le socket est trouvé
                }
            }
            return -1;
        }
    }
}

module.exports = GameService;

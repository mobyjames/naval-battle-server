import { Room } from "colyseus";
import { State } from './state';

export class GameRoom extends Room<State> {
    maxClients = 2;
    gridSize: number = 8;
    startingFleetHealth: number = 2 + 3 + 5;
    playerHealth: Array<number>;
    placements: Array<Array<number>>;
    playersPlaced: number = 0;
    players: Map<string, any>;

    onInit (options) {
        console.log("room created!", options);

        this.reset();
    }

    onJoin (client) {
        console.log("client joined", client.sessionId);

        let playerCount = this.players.keys.length;
        this.players[client.sessionId] = { sessionId: client.sessionId, seat: playerCount + 1 };

        if (playerCount == 1) {
            this.state.player1 = client.sessionId;
        } else if (playerCount == 2) {
            this.state.player2 = client.sessionId;
            this.state.phase = 'place';
        }
    }

    onLeave (client) {
        console.log("client left", client.sessionId);

        delete this.players[client.sessionId];
        this.state.phase = 'waiting';
    }

    onMessage (client, message) {
        console.log("message received", message);

        if (!message) return;

        let player = this.players[client.sessionId];

        if (!player) return;

        let command: string = message['command'];

        switch (command) {
            case 'place':
                console.log('player ' + player.seat + ' placed ships');

                this.placements[player.seat - 1] = message['placement'];
                this.playersPlaced++;

                if (this.playersPlaced == 2) {
                    this.state.phase = 'battle';
                }
                break;
            case 'turn':
                if (this.state.playerTurn != player.seat) return; // ignore if not correct player

                let targetIndex = message['targetIndex'];

                console.log('player ' + player.seat + ' targets ' + targetIndex);

                let shots = player.seat == 1 ? this.state.player1Shots : this.state.player2Shots;
                let targetPlayerIndex = player.seat == 1 ? 1 : 0; // target zero-index of other player
                let targetedPlacement = this.placements[targetPlayerIndex];

                if (targetedPlacement[targetIndex] > 0 && shots[targetIndex] == 0) {
                    shots[targetIndex] = 1; // hit
                    this.playerHealth[targetPlayerIndex]--;
                } else if (targetedPlacement[targetIndex] == 0 && shots[targetIndex] == 0) {
                    shots[targetIndex] = 2; // miss
                }

                if (this.playerHealth[targetPlayerIndex] <= 0) {
                    this.state.winningPlayer = player.seat;
                    this.state.phase = "result";
                } else {
                    this.state.playerTurn = this.state.playerTurn == 1 ? 2 : 1;
                }
                break;
            default:
                console.log('unknown command');
        }
    }

    onDispose () {
        console.log("room destroyed!");
    }

    reset() {
        this.players = new Map<string, any>();

        this.playerHealth = new Array<number>();
        this.playerHealth[0] = this.startingFleetHealth;
        this.playerHealth[1] = this.startingFleetHealth;

        this.placements = new Array<Array<number>>();
        this.placements[0] = new Array<number>();
        this.placements[1] = new Array<number>();

        let cellCount = this.gridSize * this.gridSize;
        let state = new State();

        state.phase = 'waiting';
        state.playerTurn = 1;
        state.winningPlayer = -1;

        for (var i=0; i<cellCount; i++) {
            this.placements[0][i] = 0;
            this.placements[1][i] = 0;
            
            state.player1Shots[i] = 0;
            state.player2Shots[i] = 0;
        }

        this.setState(state);
        this.playersPlaced = 0;
    }
}

import { Room } from "colyseus";
import { State, Player } from './state';

export class GameRoom extends Room<State> {
    maxClients = 2;
    gridSize: number = 8;
    startingFleetHealth: number = 2 + 3 + 5;
    playerHealth: Array<number>;
    placements: Array<Array<number>>;
    playersPlaced: number = 0;
    playerCount: number = 0;

    onInit (options) {
        console.log("room created!", options);

        this.reset();
    }

    onJoin (client) {
        console.log("client joined", client.sessionId);

        let player: Player = new Player();
        player.sessionId = client.sessionId;
        player.seat = this.playerCount + 1;

        this.state.players[client.sessionId] = player;
        this.playerCount++;

        if (this.playerCount == 2) {
            this.state.phase = 'place';
            this.lock();
        }
    }

    onLeave (client) {
        console.log("client left", client.sessionId);

        delete this.state.players[client.sessionId];
        this.playerCount--;
        this.state.phase = 'waiting';
    }

    onMessage (client, message) {
        console.log("message received", message);

        if (!message) return;

        let player: Player = this.state.players[client.sessionId];

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

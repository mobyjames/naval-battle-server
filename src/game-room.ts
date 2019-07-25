import { Room } from "colyseus";
import { State } from './state'
import { string, number } from "@colyseus/schema/lib/encoding/decode";

const shipTypes = [
    {
        id: 1,
        name: 'scout',
        size: 2
    },
    {
        id: 2,
        name: 'cruiser',
        size: 3
    },
    {
        id: 3,
        name: 'carrier',
        size: 5
    }
];

export class GameRoom extends Room<State> {
    maxClients = 2;
    gridSize: number = 8;
    totalShipHealth: number = shipTypes.map((shipType) => shipType.size).reduce((a, b) => a + b);
    playerHealth: Array<number>;
    placements: Array<Array<number>>;
    playersPlaced: number = 0;
    players: Array<any>;

    onInit (options) {
        console.log("Room created!", options);
        this.reset();
        this.players = new Array<any>();
        // this.setState(new State());
    }

    onJoin (client) {
        console.log(`${ client.sessionId } joined.`);
        this.players.push({ sessionId: client.sessionId, seat: this.players.length + 1 });

        if (this.players.length == 1) {
            this.state.player1 = client.sessionId;
        } else if (this.players.length == 2) {
            this.state.player2 = client.sessionId;
            this.state.phase = 'place';
        }
    }

    onLeave (client) {
        this.broadcast(`${ client.sessionId } left.`);
        this.state.phase = 'waiting';
    }

    onMessage (client, message) {
        console.log("Received message from", client.sessionId, ":", message);
        
        if (!message) return;

        let player = this.players.find((player) => player.sessionId === client.sessionId);

        if (!player) return;

        let command: string = message['command'];

        switch (command) {
            case 'place':
                console.log('player ' + player.seat + ' placed ships');
                this.placements[player.seat - 1] = message['placement'];
                this.playersPlaced++;

                if (this.playersPlaced == 2) {
                    console.log('entering battle phase');
                    this.state.phase = 'battle';
                }
                break;
            case 'turn':
                if (this.state.playerTurn != player.seat) return; // ignore if not correct player

                let targetIndex = message['targetIndex'];

                console.log('player ' + player.seat + ' targets ' + targetIndex);

                let shots = player.seat == 1 ? this.state.player1Shots : this.state.player2Shots;
                let targetPlayerIndex = player.seat == 1 ? 1 : 0;
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
        console.log("Room destroyed!");
    }

    reset() {
        this.playerHealth = new Array<number>();
        this.playerHealth[0] = this.totalShipHealth;
        this.playerHealth[1] = this.totalShipHealth;

        this.placements = new Array<Array<number>>();
        this.placements[0] = new Array<number>();
        this.placements[1] = new Array<number>();

        let cellCount = this.gridSize * this.gridSize;

        let state = new State();

        this.playersPlaced = 0;
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
    }
}

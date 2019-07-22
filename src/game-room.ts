import { Room } from "colyseus";
import { State, Ship } from './state'
import { string } from "@colyseus/schema/lib/encoding/decode";

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
    gridSize = 8;

    placements: Array<Array<number>>;
    playersPlaced: number;

    players: Array<any>;

    onInit (options) {
        console.log("Room created!", options);
        this.reset();
        this.players = new Array<any>();
        // this.setState(new State());
    }

    onJoin (client) {
        this.broadcast(`${ client.sessionId } joined.`);
        this.players.push({ client, seat: this.players.length });

        // if (this.players.length == 2) {
            this.state.phase = 'place';
        // }
    }

    onLeave (client) {
        this.broadcast(`${ client.sessionId } left.`);
        this.state.phase = 'waiting';
    }

    onMessage (client, message) {
        console.log("Received message from", client.sessionId, ":", message);
        
        if (!message || !Array.isArray(message) || message.length === 0) return;

        let player = this.players.find((player) => {
            player.client.id === client.id
        });

        let command: string = message[0];

        if (!player) return;

        switch (command) {
            case 'place':
                console.log('player ' + player.seat + ' placed ships');
                this.playersPlaced++;

                if (this.playersPlaced == 2) {
                    this.state.phase = 'battle';
                }
                break;
            case 'turn':
                if (this.state.playerTurn != player.seat) return; // ignore if not your turn

                let target = message[1];
                console.log('player ' + player.seat + ' targets ' + target);

                // TODO: update shots and ships

                // TODO: check for victory

                // ... else

                this.state.playerTurn = this.state.playerTurn == 0 ? 1 : 0;
            default:
                console.log('unknown command');
        }
    }

    onDispose () {
        console.log("Room destroyed!");
    }

    reset() {
        this.placements = new Array<Array<number>>();
        this.placements[0] = new Array<number>();
        this.placements[1] = new Array<number>();

        this.playersPlaced = 0;

        let cellCount = this.gridSize * this.gridSize;

        let state = new State();

        state.phase = 'waiting';
        state.playerTurn = 0;
        state.winningPlayer = -1;

        for (var i=0; i<cellCount; i++) {
            this.placements[0][i] = 0;
            this.placements[1][i] = 0;
            
            state.player1Shots[i] = '?';
            state.player2Shots[i] = '?';
        }

        for (let shipType of shipTypes) {
            state.player1Ships[shipType.id] = Ship.create(shipType.name, shipType.size);
            state.player2Ships[shipType.id] = Ship.create(shipType.name, shipType.size);
        }

        this.setState(state);
    }
}

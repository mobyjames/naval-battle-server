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

    onMessage (client, data) {
        console.log("BasicRoom received message from", client.sessionId, ":", data);
        this.broadcast(`(${ client.sessionId }) ${ data.message }`);
    }

    onDispose () {
        console.log("Room destroyed!");
    }

    reset() {
        this.placements = new Array<Array<number>>();
        this.placements[0] = new Array<number>();
        this.placements[1] = new Array<number>();

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

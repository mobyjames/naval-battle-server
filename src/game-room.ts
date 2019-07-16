import { Room } from "colyseus";
import { State } from './state'

export class GameRoom extends Room {
    maxClients = 2;

    onInit (options) {
        console.log("Room created!", options);
        this.setState(new State());
    }

    onJoin (client) {
        this.broadcast(`${ client.sessionId } joined.`);
    }

    onLeave (client) {
        this.broadcast(`${ client.sessionId } left.`);
    }

    onMessage (client, data) {
        console.log("BasicRoom received message from", client.sessionId, ":", data);
        this.broadcast(`(${ client.sessionId }) ${ data.message }`);
    }

    onDispose () {
        console.log("Dispose BasicRoom");
    }

}

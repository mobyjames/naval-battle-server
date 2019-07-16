import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Ship extends Schema {
    @type('string')
    name: string;

    @type('number')
    size: number;

    @type('number')
    health: number;

    @type('string')
    status: string;

    static create(name: string, size: number): Ship {
        var ship = new Ship();
        ship.name = name;
        ship.size = size;
        ship.health = size;
        ship.status = 'active';

        return ship;
    }
}

export class State extends Schema {
    @type('string')
    phase: string = "waiting";

    @type('number')
    playerTurn: number = 1;

    @type('number')
    winningPlayer: number = 0;

    @type({ map: Ship })
    player1Ships: MapSchema<Ship> = new MapSchema<Ship>();

    @type({ map: Ship })
    player2Ships: MapSchema<Ship> = new MapSchema<Ship>();

    @type(['string'])
    player1Shots: ArraySchema<string> = new ArraySchema<string>();

    @type(['string'])
    player2Shots: ArraySchema<string> = new ArraySchema<string>();
}
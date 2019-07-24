import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class State extends Schema {
    @type('string')
    phase: string = "waiting";

    @type('int16')
    playerTurn: number = 1;

    @type('number')
    winningPlayer: number = 0;

    @type('string')
    player1: string = '';

    @type('string')
    player2: string = '';

    @type(['int16'])
    player1Shots: ArraySchema<number> = new ArraySchema<number>();

    @type(['int16'])
    player2Shots: ArraySchema<number> = new ArraySchema<number>();
}
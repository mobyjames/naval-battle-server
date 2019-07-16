import { Schema, type, MapSchema } from "@colyseus/schema";

export class State extends Schema {
    @type('string')
    hello: string;
}
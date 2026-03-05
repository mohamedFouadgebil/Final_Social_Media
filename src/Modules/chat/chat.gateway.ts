import { Server } from "socket.io";
import { IAuthSocket } from "../gateway/gateway.dto";
import { ChatEvent } from "./chat.events";

export class ChatGateway {
    private _chatEvent = new ChatEvent();

    constructor() {}

    register = (socket: IAuthSocket , io:Server) => {
        this._chatEvent.sayHi(socket , io);
        this._chatEvent.sendMessage(socket , io);
        this._chatEvent.joinRoom(socket , io);
    };
}

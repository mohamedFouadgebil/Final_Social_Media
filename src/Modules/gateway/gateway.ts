import { JwtPayload } from "jsonwebtoken";
import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { decodedToken, TokenTypeEnum } from "../../Utils/security/token";
import { HUserDocument } from "../../DB/Models/user.model";
import { ChatGateway } from "../chat/chat.gateway";

interface IAuthSocket extends Socket {
    credentials?: {
        user: Partial<HUserDocument>;
        decoded: JwtPayload;
    };
    }

    let io : Server | null = null
    export const initialize = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
        origin: "*",
        },
    });

    const connectedSockets = new Map<string, string[]>();

    io.use(async (socket: IAuthSocket, next) => {
        try {
        const { user, decoded } = await decodedToken({
            authorization: socket.handshake.auth.authorization,
            tokenType: TokenTypeEnum.ACCESS,
        });

        const userTabs = connectedSockets.get(user._id.toString()) || [];
        userTabs.push(socket.id);
        connectedSockets.set(user._id.toString(), userTabs);

        socket.credentials = { user, decoded };
        next();
        } catch (error: any) {
        next(error);
        }
    });

    function dicsconnection(socket: IAuthSocket) {
        socket.on("disconnect", () => {
        const userId = socket.credentials?.user._id?.toString() as string;

        let remainingTabs =
            connectedSockets.get(userId)?.filter((tab) => {
            return tab !== socket.id;
            }) || [];

        if (remainingTabs.length) {
            connectedSockets.set(userId, remainingTabs);
        } else {
            connectedSockets.delete(userId);
        }

        console.log(`After Delete::: ${connectedSockets.get(userId)}`);
        console.log(connectedSockets);
        });
    }

    const chatGateway: ChatGateway = new ChatGateway();

    io.on("connection", (socket: IAuthSocket) => {
        console.log(connectedSockets);
        chatGateway.register(socket , getIo());

        socket.on("disconnect", () => {
        dicsconnection(socket);
        });
    });
};

export const getIo = (): Server => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
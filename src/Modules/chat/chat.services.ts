import { ICreateGroupChatDTO, IGetChatDTO, IGetGroupChatDTO, ISayHiDTO, ISendMessageDTO, JoinRoomDTO, SendGroupMessageDTO } from "./chat.dto";
import { ChatRepository } from "../../DB/repository/chat.repository";
import { ChatModel } from "../../DB/Models/chat.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { UserModel } from "../../DB/Models/user.model";
import { Types } from "mongoose";
import { Request, Response } from "express";
import { BadRequestException, NotFoundException } from "../../Utils/response/error.response";
import {v4 as uuid} from "uuid"

export class ChatService {
    private _chatModel = new ChatRepository(ChatModel);
    private _userModel = new UserRepository(UserModel);
    constructor() {}

    getChat = async (req: Request, res: Response) => {
        const { userId } = req.params as unknown as IGetChatDTO;
        const chat = await this._chatModel.findOne({
        filter: {
            participants: {
            $all: [
                req.user?._id as Types.ObjectId,
                Types.ObjectId.createFromHexString(userId),
            ],
            },
            group: { $exists: false },
        },
        options: {
            populate: "participants",
        },
        });
        if (!chat) throw new NotFoundException("Fail to Find Chat");
        return res.status(200).json({ message: "Done", data: { chat } });
    };

    sayHi = ({ message, socket, callback , io}: ISayHiDTO) => {
        try {
        console.log(message);

        callback ? callback("I Recived Your Message") : undefined;
        } catch (error) {
        socket.emit("custom_error", error);
        }
    };

    sendMessage = async ({ content, socket, sendTo , io}: ISendMessageDTO) => {
        try {
            if (!socket.credentials?.user) {
                throw new Error("Unauthorized User");
            }
            const createdBy = socket.credentials.user?._id as Types.ObjectId;
            const user = await this._userModel.findOne({
            filter: {
                _id: Types.ObjectId.createFromHexString(sendTo),
                friends: { $in: [createdBy] },
            },
            });
            if (!user) throw new NotFoundException("User Not Found");
            const chat = await this._chatModel.findOneAndUpdate({
            filter: {
                participants: {
                $all: [
                    createdBy as Types.ObjectId,
                    Types.ObjectId.createFromHexString(sendTo),
                ],
                },
                group: { $exists: false },
            },
            update: {
                $addToSet: {
                messages: {
                    content,
                    createdBy,
                },
                },
            },
            });
            if (!chat) {
            const [newChat] =
                (await this._chatModel.create({
                data: [
                    {
                    createdBy,
                    messages: [{ content, createdBy }],
                    participants: [
                        createdBy,
                        Types.ObjectId.createFromHexString(sendTo),
                    ],
                    },
                ],
                })) || [];
                io.emit("newChat" , newChat)
            if (!newChat) throw new BadRequestException("Fail To Create Chat");
            }
            io.emit("successMessage" , {content , from : socket.credentials?.user})
        } catch (error) {
            socket.emit("custom_error", error);
        }
    };
    createGroupChat = async (req: Request, res: Response) => {
        const { participants, group } = req.body as ICreateGroupChatDTO;
        const dbParticipants = participants.map((participant) => {
            return Types.ObjectId.createFromHexString(participant);
        });
        const users = await this._userModel.find({
            filter: {
            _id: { $in: dbParticipants },
            friends: { $in: [req.user?._id as Types.ObjectId] },
            },
        });
        if (dbParticipants.length !== users.length) {
            throw new BadRequestException("Please Provide valid dbParticipants");
        }
        const roomId = uuid();
        const [newGroup] = (await this._chatModel.create({
            data: [
                {
                createdBy: req.user?._id as Types.ObjectId,
                group,
                roomId,
                participants: [...dbParticipants, req.user?._id as Types.ObjectId],
                },
            ],
            })) || [];
        if (!newGroup) throw new BadRequestException("Fail to create Group chat");
    return res.status(200).json({ message: "Done", data: { newGroup } });
    };

    getGroupChat = async (req: Request, res: Response) => {
        const { groupId } = req.params as IGetGroupChatDTO;
        const chat = await this._chatModel.findOne({
            filter: {
            _id: Types.ObjectId.createFromHexString(groupId),
            group: { $exists: true },
            particiants: { $in: req.user?._id as Types.ObjectId },
            },
            options: {
            populate: "messages.createdBy",
            },
        });
        if (!chat) throw new BadRequestException("Fail to Find Chat");
        return res.status(200).json({ message: "Done", data: { chat } });
    };

    joinRoom = async ({ roomId, socket, io }: JoinRoomDTO) => {
        try {
            const chat = await this._chatModel.findOne({
            filter: {
                roomId,
                particiants: {
                $in: socket.credentials?.user?._id as Types.ObjectId,
                },
                group: { $exists: true },
            },
            });

            if (!chat) throw new NotFoundException("Fail To join Romm");

            socket.join(chat.roomId as string);
        } catch (error) {
            socket.emit("custom_error", error);
        }
    };

    sendGroupMessage = async ({
        content,
        groupId,
        socket,
        io,
        }: SendGroupMessageDTO) => {
        try {
            const createdBy = socket.credentials?.user?._id as Types.ObjectId;
            const chat = await this._chatModel.findOneAndUpdate(
            {
                filter: {
                _id: Types.ObjectId.createFromHexString(groupId),
                particiants: { $in: [createdBy as Types.ObjectId] },
                group: { $exists: true },
                },
                update: {
                $addToSet: {
                    messages: {
                    content,
                    createdBy,
                    },
                },
                },
            }
            );

            if (!chat) throw new NotFoundException("Fail to matching group");

            io?.emit("successMessage", { content });
        } catch (error) {
            socket.emit("custom_error", error);
        }
    };

}

export default new ChatService()
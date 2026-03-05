import { Request, Response } from "express";
import { LogoutDTO } from "./user.dto";
import {
  createLoginCredentials,
  createRevokeToken,
  LogoutEnum,
} from "../../Utils/security/token";
import { JwtPayload } from "jsonwebtoken";
import { Types, UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../DB/Models/user.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { createPresignedURL, uploadFiles } from "../../Utils/Multer/s3.config";
import { FriendModel } from "../../DB/Models/friendReguest.model";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../Utils/response/error.response";
import { FriendRepository } from "../../DB/repository/friend.repository";
import { ChatRepository } from "../../DB/repository/chat.repository";
import { ChatModel } from "../../DB/Models/chat.model";

class UserService {
  private _userModel = new UserRepository(UserModel);
  private _friendModel = new FriendRepository(FriendModel);
  private _chatModel = new ChatRepository(ChatModel);

  constructor() {}

    getProfile = async (req: Request, res: Response): Promise<Response> => {
      await req.user?.populate("friends");
      const groups = await this._chatModel.find({
        filter: {
          particiants: { $in: req.user?._id as Types.ObjectId },
          group: { $exists: true },
        },
      });
      return res
        .status(200)
        .json({ message: "Done", user: req.user, decoded: req.decoded, groups });
    };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: LogoutDTO = req.body;
    let statusCode: number = 200;
    const update: UpdateQuery<IUser> = {};

    switch (flag) {
      case LogoutEnum.ONLY:
        await createRevokeToken(req.decoded as JwtPayload);
        statusCode = 201;
        break;
      case LogoutEnum.ALL:
        update.changeCredentialsTime = new Date();
        break;
      default:
        break;
    }

    await this._userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update,
    });

    return res.status(statusCode).json({
      message: "Done",
    });
  };

  profileImage = async (req: Request, res: Response): Promise<Response> => {
    const {
      ContentType,
      originalname,
    }: { ContentType: string; originalname: string } = req.body;

    const { url, Key } = await createPresignedURL({
      ContentType: ContentType,
      originalname: originalname,
      path: `users/${req.decoded?._id}`,
    });

    await this._userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update: {
        profileImage: Key,
      },
    });

    return res.status(200).json({ message: "Done", url, Key });
  };

  coverImages = async (req: Request, res: Response): Promise<Response> => {
    const urls = await uploadFiles({
      files: req.files as Express.Multer.File[],
      path: `users/${req.decoded?._id}/cover`,
    });

    return res.status(200).json({ message: "Done", urls });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as JwtPayload);
    return res.status(201).json({ message: "Done", data: credentials });
  };

  sendFriendRequest = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    if (!req.user?._id) {
      throw new Error("Unauthorized");
    }
    const { userId } = req.params as unknown as { userId: Types.ObjectId };
    const checkFriendRequestExists = await this._friendModel.findOne({
      filter: {
        createdBy: { $in: [req.user._id, userId] },
        sendTo: { $in: [req.user._id, userId] },
      },
    });
    if (checkFriendRequestExists) {
      throw new ConflictException("Friend Request Already Exists");
    }

    const user = await this._userModel.findOne({
      filter: {
        _id: userId,
      },
    });

    if (!user) throw new NotFoundException("User Not Found");

    const [friend] =
      (await this._friendModel.create({
        data: [
          {
            createdBy: req.user?._id as Types.ObjectId,
            sendTo: userId,
          },
        ],
      })) || [];

    if (!friend) throw new BadRequestException("Fail To send Friend Request");

    return res.status(201).json({ message: "Done", data: friend });
  };

  acceptFriendRequest = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { requestId } = req.params as unknown as {
      requestId: Types.ObjectId;
    };
    const checkFriendRequestExists = await this._friendModel.findOneAndUpdate({
      filter: {
        _id: requestId,
        sendTo: req.user!._id,
        acceptedAt: { $exists: false },
      },
      update: {
        acceptedAt: new Date(),
      },
    });
    
    if (!checkFriendRequestExists) {
      throw new ConflictException("Fail To Accept Friend Request");
    }

    await Promise.all([
      this._userModel.updateOne({
        filter: {
          _id: checkFriendRequestExists.createdBy,
        },
        update: {
          $addToSet: {
            friends: checkFriendRequestExists.sendTo,
          },
        },
      }),
      this._userModel.updateOne({
        filter: {
          _id: checkFriendRequestExists.sendTo,
        },
        update: {
          $addToSet: {
            friends: checkFriendRequestExists.createdBy,
          },
        },
      }),
    ]);

    return res.status(201).json({ message: "Done" });
  };
}

export default new UserService();

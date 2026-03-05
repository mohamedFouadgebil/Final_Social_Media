import { Request, Response } from "express";
import {
  AvailablityEnum,
  LikeUnlikeEnum,
  PostModel,
} from "../../DB/Models/post.model";
import { HUserDocument, RoleEnum, UserModel } from "../../DB/Models/user.model";
import { PostRepository } from "../../DB/repository/post.repository";
import { UserRepository } from "../../DB/repository/user.repository";
import { uploadFiles } from "../../Utils/Multer/s3.config";
import {
  BadRequestException,
  NotFoundException,
} from "../../Utils/response/error.response";
import { uuid } from "zod";
import { UpdateQuery } from "mongoose";

export const PostAvailability = (req: Request) => {
  if (!req.user?._id) throw new Error("Unauthorized");

  if (req.user.role === RoleEnum.ADMIN) return [{}];

  return [
    { availability: AvailablityEnum.PUBLIC },
    { createdBy: req.user._id },
  ];
};

class PostService {
  private _userModel = new UserRepository(UserModel);
  private _postModel = new PostRepository(PostModel);

  constructor() {}

  createPost = async (req: Request, res: Response) => {
    if (
      req.body.tags?.length &&
      (await this._userModel.find({ filter: { _id: req.body.tags } }))
        .length !== req.body.tags.length
    ) {
      throw new NotFoundException("Some Mentioned User Does Not Exists");
    }

    let attachments: string[] = [];
    let assetFolder = undefined;

    if (req.files?.length) {
      let assetPostFolderId = uuid();

      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user?._id}/post/${assetPostFolderId}`,
      });

      assetFolder = assetPostFolderId;
    }

    const [post] =
      (await this._postModel.create({
        data: [
          {
            ...req.body,
            attachments,
            assetPostFolderId: assetFolder,
            createdBy: req.user?._id,
          },
        ],
      })) || [];
    if (!post) throw new BadRequestException("Fail To Create Post");

    return res.status(201).json({ message: "Post Created Successfully", post });
  };

  likePost = async (req: Request, res: Response) => {
    const { postId } = req.params as unknown as { postId: string };
    const { action } = req.query as unknown as { action: string };

    let update: UpdateQuery<HUserDocument> = {
      $addToSet: { likes: req.user?._id },
    };

    if (action === LikeUnlikeEnum.UNLIKE) {
      update = { $pull: { likes: req.user?._id } };
    }

    const post = await this._postModel.findOneAndUpdate({
      filter: { _id: postId, availability: AvailablityEnum.PUBLIC },
      update,
    });

    if (!post) throw new NotFoundException("Post Does Not Exists");

    return res.status(200).json({ message: "Done", post });
  };

  getAllPosts = async (req: Request, res: Response) => {
    let { page, size } = req.query as unknown as { page: number; size: number };

    const posts = await this._postModel.paginate({
      filter: { availability: AvailablityEnum.PUBLIC },
      page,
      size,
    });

    return res
      .status(200)
      .json({ message: "Posts Fetched Successfully", posts });
  };
}

export default new PostService();

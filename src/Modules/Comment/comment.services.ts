import { Request, Response } from "express";
import { UserRepository } from "../../DB/repository/user.repository";
import { UserModel } from "../../DB/Models/user.model";
import { AllowCommentsEnum, PostModel } from "../../DB/Models/post.model";
import { PostRepository } from "../../DB/repository/post.repository";
import { CommentModel } from "../../DB/Models/comment.model";
import { BadRequestException, NotFoundException } from "../../Utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../Utils/Multer/s3.config";
import { PostAvailability } from "../Post/post.services";
import { CommentRepository } from "../../DB/repository/comment.repository";

class CommetService {
  private _userModel = new UserRepository(UserModel);
  private _postModel = new PostRepository(PostModel);
  private _commentModel = new CommentRepository(CommentModel);

  constructor() {}

  createComment = async (req: Request, res: Response) => {
    const { postId } = req.params as unknown as { postId: string };

    const post = await this._postModel.findOne({
      filter: {
        _id: postId,
        allowComments: AllowCommentsEnum.ALLOW,
        $or: PostAvailability(req),
      },
    });

    if (!post) throw new NotFoundException("Fail To Match Results");

    if (
      req.body.tags?.length &&
      (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
        .length !== req.body.tags.length
    ) {
      throw new NotFoundException("Some Mentioned User does not exists");
    }

    let attachments: string[] = [];

    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.createdBy}/post/${post.assetPostFolderId}`,
      });
    }

    const [comment] =
      (await this._postModel.create({
        data: [
          {
            ...req.body,
            attachments,
            postId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];

    if (!comment) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("Fail to create Post");
    }

    return res.status(201).json({ message: "Comment Created Successfully" });
  };
}

export default new CommetService();

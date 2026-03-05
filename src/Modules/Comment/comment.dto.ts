import { PostModel } from "../../DB/Models/post.model";
import { UserModel } from "../../DB/Models/user.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { Request, Response } from "express";
import { PostRepository } from "../../DB/repository/post.repository";

class CommentService {
  private _userModel = new UserRepository(UserModel);
  private _postModel = new PostRepository(PostModel);

  constructor() {}

  createComment = async (req: Request, res: Response) => {
    return res.status(201).json({ message: "Comment Created Successfully" });
  };
}

export default new CommentService();

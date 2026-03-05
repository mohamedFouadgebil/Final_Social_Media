import { Router } from "express";
import { createPostSchema } from "./post.validation";
import { TokenTypeEnum } from "../../Utils/security/token";
import { RoleEnum } from "../../DB/Models/user.model";
import { authentication } from "../../Middleware/authentication.middleware";
import { validation } from "../../Middleware/validation.middleware";
import postService from "./post.services";
import commentRouter from "../Comment/comment.controller";
const router: Router = Router();

router.use("/:postId/comment", commentRouter);

router.post(
  "/",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  validation(createPostSchema),
  postService.createPost,
);

router.patch(
  "/:postId/like",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  validation(createPostSchema),
  postService.likePost,
);

router.get(
  "/",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  postService.getAllPosts,
);

export default router;

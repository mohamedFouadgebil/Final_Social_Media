import { Router } from "express";
import commentService from "./comment.services";
import { authentication } from "../../Middleware/authentication.middleware";
import { endpoint } from "./comment.authorization";
import * as validators from "./comment.validation";
import { TokenTypeEnum } from "../../Utils/security/token";
import { validation } from "../../Middleware/validation.middleware";
import { cloudFileUpload, fileValidation } from "../../Utils/Multer/cloud.multer";

const router: Router = Router({
  mergeParams: true,
});

router.post(
  "/",
  authentication(TokenTypeEnum.ACCESS , endpoint.createComment),
  cloudFileUpload({ validation: fileValidation.images }).array(
    "attachments",
    3,
  ),
  validation(validators.createCommentSchema),
  commentService.createComment,
);
export default router;

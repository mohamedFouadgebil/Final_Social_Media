import { Router } from "express";
import userService from "./user.services";
import { authentication } from "../../Middleware/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
import { RoleEnum } from "../../DB/Models/user.model";
import { validation } from "../../Middleware/validation.middleware";
import { logoutSchema } from "./user.validation";
import {
  cloudFileUpload,
  fileValidation,
  StorageEnum,
} from "../../Utils/Multer/cloud.multer";
import * as validators from "./user.validation";
import chatRouter from "../../Modules/chat/chat.controller"

const router: Router = Router();

router.use("/:userId/chat" , chatRouter)

router.get(
  "/profile",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  userService.getProfile,
);

router.patch(
  "/profile-image",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  cloudFileUpload({
    validation: fileValidation.images,
    storageApproch: StorageEnum.MEMORY,
    maxSizeMB: 3,
  }).single("attachments"),
  userService.profileImage,
);

router.patch(
  "/cover-image",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  cloudFileUpload({
    validation: fileValidation.images,
    storageApproch: StorageEnum.MEMORY,
    maxSizeMB: 6,
  }).array("attachments", 5),
  userService.coverImages,
);

router.post(
  "/logout",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  validation(logoutSchema),
  userService.logout,
);

router.post(
  "/refresh-token",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER]),
  userService.refreshToken,
);

router.post(
  "/:userId/friend-request",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER, RoleEnum.ADMIN]),
  validation(validators.sendFriendRequestSchema),
  userService.sendFriendRequest,
);

router.patch(
  "/:requestId/accept",
  authentication(TokenTypeEnum.ACCESS, [RoleEnum.USER, RoleEnum.ADMIN]),
  validation(validators.acceptFriendRequestSchema),
  userService.acceptFriendRequest,
);

export default router;

import { Router } from "express";
import { authentication } from "../../Middleware/authentication.middleware";
import { endpoint } from "./chat.authorization";
import { validation } from "../../Middleware/validation.middleware";
import * as validators from "./chat.validation";
import chatService from "./chat.services";
import { TokenTypeEnum } from "../../Utils/security/token";

const router: Router = Router({
    mergeParams: true,
});

router.get(
    "/",
    authentication(TokenTypeEnum.ACCESS, endpoint.getChat),
    validation(validators.getChatSchema),
    chatService.getChat,
);

router.post(
    "/group",
    authentication(TokenTypeEnum.ACCESS , endpoint.getChat),
    validation(validators.getChatSchema),
    chatService.createGroupChat
);

router.get(
    "/group/:groupId",
    authentication(TokenTypeEnum.ACCESS , endpoint.getChat),
    validation(validators.getGroupChatSchema),
    chatService.getGroupChat
);

router.post(
    "/group/:groupId/message",
    authentication(TokenTypeEnum.ACCESS, endpoint.getChat),
    validation(validators.sendMessageSchema),
    chatService.sendGroupMessage
);

export default router;

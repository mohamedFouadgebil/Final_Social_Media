import z from "zod";
import { LogoutEnum } from "../../Utils/security/token";
import { generalFields } from "../../Middleware/validation.middleware";

export const logoutSchema = {
  body: z.strictObject({
    flag: z.enum(LogoutEnum).default(LogoutEnum.ONLY),
  }),
};

export const sendFriendRequestSchema = {
  params: z.strictObject({
    userId: generalFields.id,
  }),
};

export const acceptFriendRequestSchema = {
  params: z.strictObject({
    requestId: generalFields.id,
  }),
};

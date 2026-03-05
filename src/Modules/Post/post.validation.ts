import z from "zod";
import { generalFields } from "../../Middleware/validation.middleware";
import { AllowCommentsEnum, AvailablityEnum, LikeUnlikeEnum } from "../../DB/Models/post.model";
import { fileValidation } from "../../Utils/Multer/cloud.multer";

export const createPostSchema = {
  body: z
    .strictObject({
      content: z.string().min(2).max(500000).optional(),
      attachments: z
        .array(generalFields.file(fileValidation.images))
        .max(3)
        .optional(),
      allowComments: z
        .enum(Object.values(AllowCommentsEnum))
        .default(AllowCommentsEnum.ALLOW),
      availablity: z
        .enum(Object.values(AvailablityEnum))
        .default(AvailablityEnum.PUBLIC),
      likes: z.array(generalFields.id).optional(),
      tags: z.array(generalFields.id).max(20).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.attachments?.length && !data.content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Please Provide content or attachments",
        });
      }
      if (
        data.tags?.length &&
        data.tags.length !== [...new Set(data.tags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "Please Provide Unique Tags",
        });
      }
    }),
};

export const likePostSchema = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
  query: z.strictObject({
    action: z.enum(Object.values(LikeUnlikeEnum)).default(LikeUnlikeEnum.LIKE),
  }),
};

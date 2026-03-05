import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export enum AllowCommentsEnum {
  ALLOW = "ALLOW",
  DENY = "DENY",
}

export enum AvailablityEnum {
  PUBLIC = "PUBLIC",
  FRIENDS = "FRIENDS",
  ONLYME = "ONLYME",
}

export enum LikeUnlikeEnum {
  LIKE = "LIKE",
  UNLIKE = "UNLIKE",
}

export interface IPost {
  content?: string;
  attachments: string[];
  allowComments: AllowCommentsEnum;
  availablity: AvailablityEnum;
  assetPostFolderId ?: string,

  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];

  createdBy: Types.ObjectId;

  freezedBy?: Types.ObjectId;
  freezedAt?: Date;

  restoredBy?: Types.ObjectId;
  restoredAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type HPostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 500000,
      required: function(this : IPost){
        return !this.attachments?.length
      },
    },
    assetPostFolderId : String,
    attachments: [String],
    allowComments: {
      type: String,
      enum: Object.values(AllowCommentsEnum),
      default: AllowCommentsEnum.ALLOW,
    },
    availablity: {
      type: String,
      enum: Object.values(AvailablityEnum),
      default: AvailablityEnum.PUBLIC,
    },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    freezedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    freezedAt: Date,
    restoredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    restoredAt: Date,
  },
  { timestamps: true },
);

export const PostModel = models.Post || model<IPost>("Post", postSchema);

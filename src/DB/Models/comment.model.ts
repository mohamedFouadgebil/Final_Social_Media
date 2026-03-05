import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IComment {
  content?: string;
  attachments?: string[];
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  createdBy: Types.ObjectId;
  postId: Types.ObjectId;
  commentId?: Types.ObjectId;
  freezedBy?: Types.ObjectId;
  freezedAt?: Date;
  restoredBy?: Types.ObjectId;
  restoredAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type HCommentDocumnet = HydratedDocument<IComment>;

export const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 500000,
      required: function (this: HCommentDocumnet): boolean {
        return !this.attachments?.length;
      },
    },
    attachments: [String],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    commentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Post",
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

commentSchema.pre(
  ["find", "findOne", "findOneAndUpdate", "updateOne"],
  function () {
    const query = this.getQuery();
    if (query.paranoId === false) {
      this.setQuery({ ...query });
    } else {
      this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
  },
);

export const CommentModel =
  models.Comment || model<IComment>("Comment", commentSchema);

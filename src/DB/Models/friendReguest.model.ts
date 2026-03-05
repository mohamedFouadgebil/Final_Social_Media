import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IFriendRequest {
    createdBy: Types.ObjectId;
    sendTo: Types.ObjectId;
    acceptedAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
}

export const friendSchema = new Schema<IFriendRequest>(
{
    createdBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    sendTo: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    acceptedAt: Date,
},
{ timestamps: true },
);

export const FriendModel = models.Friend || model<IFriendRequest>("Friend", friendSchema);
export type HFriendDocument = HydratedDocument<IFriendRequest>;

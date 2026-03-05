import {
  HydratedDocument,
  Model,
  model,
  models,
  Schema,
  Types,
  UpdateQuery,
} from "mongoose";
import { TokenRepository } from "../repository/token.repository";
import { TokenModel } from "./token.model";
import { generateHash } from "../../Utils/security/hash";
import { emailEvent } from "../../Utils/events/event.email";

export enum GenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum RoleEnum {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  userName?: string;
  slug: string;

  email: string;
  confirmEmailOTP?: string;
  confirmedAt?: Date;
  password: string;
  resetPasswordOTP?: string;
  changeCredientialsTime: Date;

  phone?: string;
  address?: string;

  gender: GenderEnum;
  role: RoleEnum;

  createdAt: Date;
  updatedAt?: Date;
}
export const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, minLength: 2, maxLength: 25 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 25 },
    email: { type: String, required: true, unique: true },
    slug: { type: String, required: true },
    confirmEmailOTP: String,
    confirmedAt: Date,
    changeCredientialsTime: Date,
    password: { type: String, required: true },
    resetPasswordOTP: String,
    phone: String,
    address: String,
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.MALE,
    },
    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.USER,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

/* userSchema.pre("validate", function () {
  if (!this.slug?.includes("-")) {
    throw new BadRequestException(
      "slug is Required and must hold - like ex: first-name-last-name",
    );
  }
});

userSchema.post("validate", function (doc) {
  console.log("Pre Hook", doc);
});
userSchema.pre("save", async function () {
  console.log({
    new: this.isNew,
  });

  if (this.isModified("password")) {
    this.password = await generateHash(this.password);
  }
});

userSchema.pre(
  "save",
  async function (this: HUserDocument & { wasNew: boolean }) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
      this.password = await generateHash(this.password);
    }
  },
);

userSchema.pre("updateOne", async function () {
  console.log({ this: this });
});

userSchema.pre(
  "updateOne",
  { document: true, query: false },
  async function () {
    console.log({ this: this });
  },
);

userSchema.pre("findOne", function () {
  console.log({ this: this, query: this.getQuery() });
  const query = this.getQuery();
  this.setQuery({...query , freezedAt : {$exists : true}})
});
 */

userSchema.post("updateOne", async function () {
  console.log({ this: this });
  const query = this.getQuery();
  const update = this.getUpdate() as UpdateQuery<HUserDocument>;

  if (update.freezedAt) {
    this.setUpdate({ ...update, changeCredentialsTime: new Date() });
  }
});

userSchema.post(["findOneAndUpdate", "updateOne"], async function () {
  const query = this.getQuery();
  const update = this.getUpdate() as UpdateQuery<HUserDocument>;

  if (update["$set"].changeCredentialsTime) {
    const tokenModel = new TokenRepository(TokenModel);
    await tokenModel.deleteMany({ filter: { userId: query._id } });
  }
});

userSchema.pre("deleteOne", async function () {
  const query = this.getQuery();
  const tokenModel = new TokenRepository(TokenModel);
  await tokenModel.deleteMany({ filter: { userId: query._id } });
});

userSchema.pre("insertMany", async function (docs) {
  for (const doc of docs) {
    doc.password = await generateHash(doc.password);
  }
});

userSchema.pre(
  "save",
  async function (
    this: HUserDocument & { wasNew: boolean; confirmEmailPlainOTP?: string },
  ) {
    this.wasNew = this.isNew;

    if (this.isModified("password")) {
      this.password = await generateHash(this.password);
    }

    if (this.isModified("confirmEmailOTP")) {
      this.confirmEmailPlainOTP = this.confirmEmailOTP as string;
      this.confirmEmailOTP = await generateHash(this.confirmEmailOTP as string);
    }
  },
);

userSchema.post("save", async function (doc, next) {
  const that = this as HUserDocument & {
    wasNew: boolean;
    confirmEmailPlainOTP?: string;
  };

  if (that.wasNew && that.confirmEmailPlainOTP) {
    emailEvent.emit("confirmEmail", {
      to: this.email,
      username: this.userName,
      otp: that.confirmEmailPlainOTP,
    });
  }

  next();
});

export const UserModel: Model<IUser> =
  models.User || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;

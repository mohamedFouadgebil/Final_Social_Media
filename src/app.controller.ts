import { config } from "dotenv";
import path from "node:path";
import express from "express";
import type { Express, Response, Request } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRouter from "./Modules/Auth/auth.controller";
import userRouter from "./Modules/User/user.controller";
import postRouter from "./Modules/Post/post.controller";
import commentRouter from "./Modules/Comment/comment.controller";
import chatRouter from "./Modules/chat/chat.controller";
import {
  BadRequestException,
  globalErrorHandler,
} from "./Utils/response/error.response";
import connectDB from "./DB/connection";
import {
  createGetPresignedURL,
  deleteFile,
  getFile,
} from "./Utils/Multer/s3.config";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import { initialize } from "./Modules/gateway/gateway";
const createS3WriteStreamPipe = promisify(pipeline);

config({ path: path.resolve("./config/.env.dev") });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: {
    status: 429,
    message: "Too Many Requests, Please Try again later",
  },
});

const bootstrap = async () => {
  const app: Express = express();
  const port: number = Number(process.env.PORT) || 5000;
  app.use(cors(), express.json(), helmet());
  app.use(limiter);
  await connectDB();
  const createS3WriteStreamPipe = promisify(pipeline);

  app.get("/uploads/*path", async (req, res) => {
    const { downloadName } = req.query;
    const { path } = req.params as unknown as { path: string[] };
    const Key = path.join("/");
    const s3Response = await getFile({ Key });
    if (!s3Response.Body) {
      throw new BadRequestException("Fail to Fetch Asset");
    }
    res.setHeader(
      "Content-Type",
      s3Response.ContentType || "application/octet-stream",
    );
    if (downloadName) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadName}"`,
      );
    }
    return await createS3WriteStreamPipe(
      s3Response.Body as NodeJS.ReadableStream,
      res,
    );
  });

  app.get("/uploads/pre-signed/*path", async (req, res) => {
    const { path } = req.params as unknown as { path: string[] };
    const Key = path.join("/");

    app.get("/test-s3", async (req: Request, res: Response) => {
      const { Key } = req.query as { Key: string };
      const results = await deleteFile({ Key: Key as string });
      return res.status(200).json({ message: "Done", results });
    });

    const url = await createGetPresignedURL({
      Key,
    });

    return res.status(200).json({ message: "Done", url });
  });

  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome To Social Media App" });
  });
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/post", postRouter);
  app.use("/api/v1/comment", commentRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("{/*dummy}", (req: Request, res: Response) => {
    res.status(404).json({ message: "Not Found Handler" });
  });

  /* async function user() {
    try {
      const user = new UserModel({
        username: "test test",
        email: `${Date.now()}@gmail.com`,
        password: "Mohamed@123 ",
      });
      await user.save({ validateBeforeSave: true });
      user.lastName = "ali";
      await user.save();
    } catch (error) {
      console.log(error);
    }
  }
  user();
 */
  /*   async function userTwo() {
    try {
      const userRepo = new UserRepository(UserModel);
      const user = await userRepo.findOne({ filter: {} });
      if (!user) {
        throw new Error("User not found");
      }
      await user.save();
    } catch (error) {
      console.log(error);
    }
  }
  userTwo();
 */

  /*   async function user() {
  try {
    const userModel = new UserRepository(UserModel);
    const user = await userModel.findOne({
      filter: { gender: GenderEnum.MALE },
    });
    console.log(user);
    user.save();
  } catch (error) {
    console.log(error);
  }
}

user();
 */

  /*   async function user() {
    try {
      const userModel = new UserRepository(UserModel);
      const user = await userModel.findById({
        id: "698a5b930100266a2438f855" as unknown as Types.ObjectId,
      });
      console.log(user);
    } catch (error) {
      console.log(error);
    }
  }

  user();
 */
  /*   async function user() {
    try {
      const userModel = new UserRepository(UserModel);
      const user = await userModel.findOneAndUpdate({
        filter: { _id: "698a5b930100266a2438f855" },
        update: { freezedAt: new Date() },
      });

      console.log({ results: user });
    } catch (error) {
      console.log(error);
    }
  }

  user();
 */

  /*   async function user() {
    try {
      const userModel = new UserRepository(UserModel);
      const user = await userModel.findOneAndDelete({
        filter: { _id: "698a5b930100266a2438f855" },
      });
      console.log({ results: user });
    } catch (error) {
      console.log(error);
    }
  }

  user();
 */
  /*   async function user() {
    try {
      const userModel = new UserRepository(UserModel);
      const user = await userModel.insertMany({
        data: [
          {
            userName: "Ali ahmed",
            email: `${Date.now()}@gmail.com`,
            password: "Mohamed@123",
          },
          {
            userName: "Ali ahmed",
            email: `${Date.now()}@gmail.com`,
            password: "A@123",
          },
        ],
      });

      console.log({ results: user });
    } catch (error) {
      console.log(error);
    }
  }

  user(); */

  app.use(globalErrorHandler);

  const httpServer = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  initialize(httpServer);
};

export default bootstrap;

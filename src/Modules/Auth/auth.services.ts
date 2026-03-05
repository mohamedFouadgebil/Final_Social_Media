import { Request, Response } from "express";
import { IConfirmEmailDTO, ILoginDTO, ISignupDTO } from "./auth.dto";
import { UserModel } from "../../DB/Models/user.model";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../Utils/response/error.response";
import { UserRepository } from "../../DB/repository/user.repository";
import { compareHash, generateHash } from "../../Utils/security/hash";
import { generateOtp } from "../../Utils/security/generateOtp";
import { emailEvent } from "../../Utils/events/event.email";
import { createLoginCredentials} from "../../Utils/security/token";

class AuthenticationService {
  private _userModel = new UserRepository(UserModel);

  constructor() {}

  signup = async (req: Request, res: Response): Promise<Response> => {
    const { username, email, password }: ISignupDTO = req.body;

    const checkUser = await this._userModel.findOne({
      filter: { email },
      select: "email",
    });

    if (checkUser) throw new ConflictException("User Already Exists");

    const otp = generateOtp();
    const user = await this._userModel.createUser({
      data: [
        {
          email,
          password,
          confirmEmailOTP: `${otp}`,
        },
      ],
      options: { validateBeforeSave: true },
    });
    await emailEvent.emit("confirmEmail", {
      to: email,
      username,
      otp,
    });

    return res.status(201).json({ message: "User Created Successfully", user });
  };

  login = async (req: Request, res: Response) => {
    const { email, password }: ILoginDTO = req.body;
    const user = await this._userModel.findOne({
      filter: { email },
    });

    if (!user) throw new NotFoundException("User Not Found");

    if (!user.confirmedAt) throw new BadRequestException("Verify Your Account");

    if (!(await compareHash(password, user.password)))
      throw new BadRequestException("Invalid Password");

    const credentials = await createLoginCredentials(user)

    res.status(200).json({
      message: "User Loggedin Successfully",
      credentials,
    });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp }: IConfirmEmailDTO = req.body;

    const user = await this._userModel.findOne({
      filter: {
        email,
        confirmEmailOTP: { $exists: true },
        confirmedAt: { $exists: false },
      },
    });

    if (!user) throw new NotFoundException("User Not Found");

    if (!compareHash(otp, user?.confirmEmailOTP as string)) {
      throw new BadRequestException("Invalid OTP");
    }

    await this._userModel.updateOne({
      filter: { email },
      update: { confirmedAt: new Date(), $unset: { confirmEmailOTP: true } },
    });

    return res.status(200).json({ message: "User Confirmed Successfully" });
  };
}

export default new AuthenticationService();

import { sign, verify, Secret, SignOptions, JwtPayload } from "jsonwebtoken";
import { HUserDocument, RoleEnum, UserModel } from "../../DB/Models/user.model";
import { v4 as uuid } from "uuid";
import {
  BadRequestException,
  NotFoundException,
  UnAuthorizedException,
} from "../response/error.response";
import { UserRepository } from "../../DB/repository/user.repository";
import { TokenModel } from "../../DB/Models/token.model";
import { TokenRepository } from "../../DB/repository/token.repository";

export enum SignatureLevelEnum {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum TokenTypeEnum {
  ACCESS = "ACCESS",
  REFRESH = "REFRESH",
}

export enum LogoutEnum {
  ONLY = "ONLY",
  ALL = "ALL",
}

export const generateToken = async ({
  payload,
  secret,
  options,
}: {
  payload: object;
  secret: Secret;
  options: SignOptions;
}): Promise<string> => {
  return await sign(payload, secret, options);
};

export const verifyToken = async ({
  token,
  secret,
}: {
  token: string;
  secret: Secret;
}): Promise<JwtPayload> => {
  return (await verify(token, secret)) as JwtPayload;
};

export const getSignatureLevel = async (role: RoleEnum = RoleEnum.USER) => {
  let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.USER;
  switch (role) {
    case RoleEnum.ADMIN:
      signatureLevel = SignatureLevelEnum.ADMIN;
      break;
    case RoleEnum.USER:
      signatureLevel = SignatureLevelEnum.USER;
      break;
    default:
      break;
  }
  return signatureLevel;
};

export const getSingature = async (
  signatureLevel: SignatureLevelEnum = SignatureLevelEnum.USER
): Promise<{ access_token: string; refresh_token: string }> => {
  let signatures: { access_token: string; refresh_token: string } = {
    access_token: "",
    refresh_token: "",
  };

  switch (signatureLevel) {
    case SignatureLevelEnum.ADMIN:
      signatures.access_token = process.env.ACCESS_ADMIN_TOKEN_SECRET as string;
      signatures.refresh_token = process.env
        .REFRESH_ADMIN_TOKEN_SECRET as string;
      break;
    case SignatureLevelEnum.USER:
      signatures.access_token = process.env.ACCESS_USER_TOKEN_SECRET as string;
      signatures.refresh_token = process.env
        .REFRESH_USER_TOKEN_SECRET as string;
      break;
    default:
      break;
  }

  return signatures;
};

export const createLoginCredentials = async (
  user: HUserDocument
): Promise<{ access_token: string; refersh_token: string }> => {
  const signatureLevel = await getSignatureLevel(user.role);
  const signatures = await getSingature(signatureLevel);
  const jwtid = uuid();

  const access_token = await generateToken({
    payload: { _id: user._id },
    secret: signatures.access_token,
    options: {
      expiresIn: Number(process.env.ACCESS_EXPIRES_IN),
      jwtid,
    },
  });

  const refersh_token = await generateToken({
    payload: { _id: user._id },
    secret: signatures.refresh_token,
    options: {
      expiresIn: Number(process.env.REFRESH_EXPIRES_IN),
      jwtid,
    },
  });

  return { access_token, refersh_token };
};

export const decodedToken = async ({
  authorization,
  tokenType = TokenTypeEnum.ACCESS,
}: {
  authorization: string;
  tokenType?: TokenTypeEnum;
}) => {
  const userModel = new UserRepository(UserModel);
  const tokenModel = new TokenRepository(TokenModel);

  const [bearer, token] = authorization.split(" ");
  if (!bearer || !token) throw new UnAuthorizedException("Missing Token Parts");

  const signatures = await getSingature(bearer as SignatureLevelEnum);

  const decoded = await verifyToken({
    token,
    secret:
      tokenType === TokenTypeEnum.REFRESH
        ? signatures.refresh_token
        : signatures.access_token,
  });

  if (!decoded?._id || !decoded.iat) {
    throw new UnAuthorizedException("Invalid Token Payload");
  }

  if (await tokenModel.findOne({ filter: { jti: decoded.jti as string } })) {
    throw new NotFoundException("Invalid or old login credentials");
  }

  const user = await userModel.findOne({ filter: { _id: decoded._id } });
  if (!user) throw new NotFoundException("User Not Found");

  if ((user.changeCredientialsTime?.getTime() || 0) > decoded.iat * 1000) {
    throw new UnAuthorizedException("Loggedout From All Devices");
  }
  return { user, decoded };
};

export const createRevokeToken = async (decoded: JwtPayload) => {
  const tokenModel = new TokenRepository(TokenModel);

  const [results] =
    (await tokenModel.create({
      data: [
        {
          jti: decoded.jti as string,
          expiresIn: decoded.iat as number,
          userId: decoded._id,
        },
      ],
    })) || [];

  if (!results) throw new BadRequestException("Fail to revoke token");

  return results;
};

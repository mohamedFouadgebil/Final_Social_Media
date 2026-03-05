import { NextFunction, Request, Response } from "express";
import { RoleEnum } from "../DB/Models/user.model";
import { decodedToken, TokenTypeEnum } from "../Utils/security/token";
import {
  BadRequestException,
  ForbiddenException,
} from "../Utils/response/error.response";

export const authentication = (
  tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS,
  accessRoles: RoleEnum[] = []
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      throw new BadRequestException("Missing Authorization Header");
    }

    const { decoded, user } = await decodedToken({
      authorization: req.headers.authorization,
      tokenType,
    });

    req.user = user;
    req.decoded = decoded;

    if (accessRoles.length > 0 && !accessRoles.includes(user.role)) {
      throw new ForbiddenException(
        "You are not authorized to access this route"
      );
    }

    req.user = user;
    req.decoded = decoded;

    return next();
  };
};

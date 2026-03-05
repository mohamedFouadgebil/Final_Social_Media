import { RoleEnum } from "../../DB/Models/user.model";

export const endpoint = {
  profile: [RoleEnum.USER, RoleEnum.ADMIN],
  logout: [RoleEnum.USER, RoleEnum.ADMIN],
  refreshToken: [RoleEnum.USER, RoleEnum.ADMIN],
  friendRequest: [RoleEnum.USER],
  acceptRequest: [RoleEnum.USER],
};

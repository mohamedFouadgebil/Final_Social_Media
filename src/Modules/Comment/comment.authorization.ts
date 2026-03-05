import { RoleEnum } from "../../DB/Models/user.model";

export const endpoint = {
  createComment: [RoleEnum.USER, RoleEnum.ADMIN],
};

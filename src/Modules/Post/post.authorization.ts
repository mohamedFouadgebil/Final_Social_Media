import { RoleEnum } from "../../DB/Models/user.model";

export const endpoint = {
  createPost: [RoleEnum.USER, RoleEnum.ADMIN],
};

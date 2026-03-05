import { RoleEnum } from "../../DB/Models/user.model";

export const endpoint = {
    getChat: [RoleEnum.USER, RoleEnum.ADMIN],
};

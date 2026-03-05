import * as z from "zod";
import { generalFields } from "../../Middleware/validation.middleware";

export const loginSchema = {
  body: z
  .strictObject({
    email: generalFields.email,
    password: generalFields.password,
    })
  };
  
export const confirmEmailSchema = {
  body: z
  .strictObject({
    email: generalFields.email,
    otp: generalFields.otp,
    })
  };
  
  
export const signUpSchema = {
  body: loginSchema.body.extend({
    username: generalFields.username,
    confirmPassword: generalFields.confirmPassword,
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Password Mismatch",
      });
    }

    if (data.username?.split(" ").length !== 2) {
      ctx.addIssue({
        code: "custom",
        path: ["username"],
        message: "Username must be 2 words",
      });
    }
  }),
};
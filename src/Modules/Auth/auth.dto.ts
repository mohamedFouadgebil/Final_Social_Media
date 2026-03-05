import * as z from "zod";
import { confirmEmailSchema, loginSchema, signUpSchema } from "./auth.validation";

export type ISignupDTO = z.infer<typeof signUpSchema.body>;
export type ILoginDTO = z.infer<typeof loginSchema.body>;
export type IConfirmEmailDTO = z.infer<typeof confirmEmailSchema.body>;
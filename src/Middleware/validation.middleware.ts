import { NextFunction, Request, Response } from "express";
import { BadRequestException } from "../Utils/response/error.response";
import { ZodError, ZodType } from "zod";
import * as z from "zod";
import { Types } from "mongoose";
type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): NextFunction => {
    const validationErrors: Array<{
      key: KeyReqType;
      issues: Array<{ message: string; path: (string | number | symbol)[] }>;
    }> = [];

    for (const key of Object.keys(schema) as KeyReqType[]) {
      if (!schema[key]) continue;

      const validationResults = schema[key].safeParse(req[key]);

      if (!validationResults.success) {
        const errors = validationResults.error as ZodError;
        validationErrors.push({
          key,
          issues: errors.issues.map((issue) => {
            return { message: issue.message, path: issue.path };
          }),
        });
      }
      if (validationErrors.length > 0) {
        throw new BadRequestException("Validation Error", {
          cause: validationErrors,
        });
      }
    }

    return next() as unknown as NextFunction;
  };
};

export const generalFields = {
  username: z
    .string({ error: "Username is required" })
    .min(3, { error: "Username must be at least 3 cahracters long" })
    .max(30, { error: "Username must be at least 30 cahracters long" }),
  email: z.email({ error: "Invalid Email Address" }),
  password: z.string(),
  confirmPassword: z.string(),
  otp: z.string().regex(/^\d{6}$/),
  file: function (mimetype: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(mimetype as [string, ...string[]]),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number(),
      })
      .refine(
        (data) => {
          return data.path || data.buffer;
        },
        { message: "Please provide a file" },
      );
  },
  id: z.string().refine(
    (data) => {
      return Types.ObjectId.isValid(data);
    },
    { error: "Invalid Tag Id" },
  ),
};

import multer, { FileFilterCallback } from "multer";
import os from "node:os";
import { uuid } from "zod";
import { BadRequestException } from "../response/error.response";

export enum StorageEnum {
  MEMORY = "MEMORY",
  DISK = "DISK",
}

export const fileValidation = {
  images: ["image/png", "image/jpeg", "image/jpg"],
  pdf: ["application/pdf"],
  doc: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const cloudFileUpload = ({
  validation = [],
  storageApproch = StorageEnum.MEMORY,
  maxSizeMB = 2,
}: {
  validation?: string[];
  storageApproch?: StorageEnum;
  maxSizeMB?: number;
}) => {
  const storage =
    storageApproch === StorageEnum.MEMORY
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: os.tmpdir(),
          filename: (req: Request, file: Express.Multer.File, cb) => {
            cb(null, `${uuid()}-${file.originalname}`);
          },
        });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) {
    if (!validation.includes(file.mimetype)) {
      return cb(new BadRequestException("Invalid File Type"));
    }
    return cb(null, true);
  }

  console.log(os.tmpdir());

  return multer({
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    storage,
  });
};

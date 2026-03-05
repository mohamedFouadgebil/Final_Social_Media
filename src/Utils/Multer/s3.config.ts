import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, DeleteObjectsCommandOutput, GetObjectCommand, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { StorageEnum } from "./cloud.multer";
import { BadRequestException } from "../response/error.response";
import { uuid } from "zod";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Config = () => {
  return new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
};

export const uploadFile = async ({
  storageApproch = StorageEnum.MEMORY,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = "private",
  path = "general",
  file,
}: {
  storageApproch?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
}) => {
  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${file.originalname}`,
    Body: storageApproch === StorageEnum.MEMORY ? file.buffer : file.path,
    ContentType: file.mimetype,
  });

  await s3Config().send(command);

  console.log(command.input.Key);

  if (!command?.input?.Key) {
    throw new BadRequestException("Fail to upload file");
  }

  return command.input.Key;
};

export const uploadLargeFile = async ({
    storageApproch = StorageEnum.MEMORY,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    file,
}: {
    storageApproch?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
}) => {
    const upload = new Upload({
        client: s3Config(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${file.originalname}`,
            Body: storageApproch === StorageEnum.MEMORY ? file.buffer : file.path,
            ContentType: file.mimetype,
        },
        partSize: 500 * 1024 * 1024,
    });

    upload.on("httpUploadProgress", (progress) => {
        console.log("uplaod Progress", progress);
    });

    const { Key } = await upload.done();
    
    if (!Key) throw new BadRequestException("Fail to uplaod file");

    return Key;
};

export const uploadFiles = async ({
  storageApproach = StorageEnum.MEMORY,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = "private",
  path = "general",
  files,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  files: Express.Multer.File[];
}) => {
  let urls: string[] = [];

  for (const file of files) {
    const key = await uploadFile({
      storageApproch,
      Bucket,
      ACL,
      path,
      file,
    });
    urls.push(key);
  }

  return urls;
};

export const createPresignedURL = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path = "general",
  ContentType,
  originalname,
  expiresIn = 120,
}: {
  Bucket?: string;
  path?: string;
  ContentType: string;
  originalname: string;
  expiresIn?: number;
}) => {
  const command = new PutObjectCommand({
    Bucket,
    Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-presigned-${originalname}`,
    ContentType,
  });

  const url = await getSignedUrl(s3Config(), command, {
    expiresIn,
  });

  if (!url || !command?.input.Key) {
    throw new BadRequestException("Fail to generate URL");
  }

  return { url, Key: command.input.Key };
};

export const getFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });

  return await s3Config().send(command);
};

export const createGetPresignedURL = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
  expiresIn = 120,
}: {
  Bucket?: string;
  Key: string;
  expiresIn?: number;
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });

  const url = await getSignedUrl(s3Config(), command, {
    expiresIn,
  });

  if (!url) {
    throw new BadRequestException("Fail to generate URL");
  }

  return url;
};

export const deleteFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}): Promise<DeleteObjectCommandOutput> => {
  const command = new DeleteObjectCommand({
    Bucket,
    Key,
  });

  return await s3Config().send(command);
};

export const deleteFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  urls,
  Quiet = false,
}: {
  Bucket?: string;
  urls: string[];
  Quiet?: boolean;
}): Promise<DeleteObjectsCommandOutput> => {
  const Objects = urls.map((url) => {
    return { Key: url };
  });

  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects,
      Quiet,
    },
  });

  return await s3Config().send(command);
};
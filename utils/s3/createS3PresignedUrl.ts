import s3Client, { bucket } from "./client.js";
import { PutObjectCommand, GetObjectCommand }  from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function createS3PutPresignedUrl(key: string, contentType?: string): Promise<string> {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 },);
};

export async function createS3GetPresignedUrl(key: string, contentType?: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentType: contentType });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 },);
};
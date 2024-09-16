import s3Client, { bucket }  from "./client.js";
import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const Deleted = await s3Client.send(command);
};

export async function deleteManyS3Objects(keys: string[]): Promise<void> {
    if (keys.length === 0) {
        return;
    }
    
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key }))
      }
    });
  
    const Deleted = await s3Client.send(command);
  };
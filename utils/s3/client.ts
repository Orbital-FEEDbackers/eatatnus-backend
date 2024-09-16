import { S3Client }  from "@aws-sdk/client-s3";

export const bucket = "eatatnus-bucket";

const s3Client = new S3Client({ region: "ap-southeast-1" });

export default s3Client;
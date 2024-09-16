import { Profile, Image } from "@prisma/client";
import { createS3GetPresignedUrl, createS3PutPresignedUrl } from "./s3/createS3PresignedUrl.js";

export type ProfileWithImage = Profile & { image: Image | null };

export async function transformProfileWithGetImageUrl(profile: ProfileWithImage) {
    return profile.image === null
        ? profile
        :   {
                ...profile,
                image: {
                    ...profile.image,
                    url: await createS3GetPresignedUrl(profile.image.s3Key)
                }
            }
}

export async function transformProfileWithPutImageUrl(profile: ProfileWithImage) {
    return profile.image === null
        ? profile
        :   {
                ...profile,
                image: {
                    ...profile.image,
                    url: await createS3PutPresignedUrl(profile.image.s3Key)
                }
            }
}
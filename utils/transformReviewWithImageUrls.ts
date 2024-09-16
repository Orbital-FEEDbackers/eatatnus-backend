import { Image, Review } from "@prisma/client";
import { createS3GetPresignedUrl, createS3PutPresignedUrl } from "./s3/createS3PresignedUrl.js";
import mime from "mime";

type ReviewWithImages = Review & {
    images: Image[];
    user?: {
        profile?: { image?: Image | null } | null
    } | null;
};

export async function transformReviewWithImageUrls(review: ReviewWithImages) {

    const transformImage = async (image: Image) => {
        const url = await createS3GetPresignedUrl(image.s3Key, mime.getType(image.s3Key) ?? undefined);
        return { ...image, url: url };
    };

    const [reviewImages, profileImage] = await Promise.all(
        [
            Promise.all(review.images.map(transformImage)),
            review.user?.profile?.image ? transformImage(review.user.profile.image) : null
        ]
    );

    return {
        ...review,
        images: reviewImages,
        ...(review.user?.profile?.image && {
            user: {
                ...review.user,
                profile: {
                    ...review.user.profile,
                    image: profileImage
                }
            }
        })
    };
}

export async function transformReviewsWithImageUrls(reviews: ReviewWithImages[]) {
    return Promise.all(reviews.map(transformReviewWithImageUrls));
}

export async function transformReviewWithPutImageUrls(review: ReviewWithImages) {

    const transformImage = async (image: Image) => {
        const url = await createS3PutPresignedUrl(image.s3Key, mime.getType(image.s3Key) ?? undefined);
        return { ...image, url: url };
    };

    const images = await Promise.all(review.images.map(transformImage));
    return { ...review, images: images };
}
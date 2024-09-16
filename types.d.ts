import { Review } from "@prisma/client";

export type Reviewable = {
    reviewId: number,
    review: Review,
}
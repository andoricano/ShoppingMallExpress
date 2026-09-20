import type {
    ProductPost,
    ThumbnailInfo,
} from "./productPost.js";

export interface Wishlist {
    id: string;

    clientId: string;
    productPostId: string;

    createdAt: string;
}

/** API 관심상품 조회/생성에서 반환하는 게시물 요약 포함 행 */
export interface WishlistEntry extends Wishlist {
    productPost: Pick<
        ProductPost,
        "id" | "title"
    > & {
        thumbnail: ThumbnailInfo;
    };
}

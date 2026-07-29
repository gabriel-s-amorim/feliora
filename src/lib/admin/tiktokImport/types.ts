export type SingleVariationAs = "size" | "color";

export type TikTokImportAction = "create" | "skip" | "update";

export type TikTokParsedVariant = {
  skuId: string;
  sellerSku: string;
  variationValue: string;
  price: number;
  quantity: number;
  sizeLabel: string;
  colorName: string;
};

export type TikTokParsedProduct = {
  tiktokProductId: string;
  name: string;
  description: string;
  categoryRaw: string;
  categoryCode: string | null;
  categoryName: string | null;
  categoryId: string | null;
  categoryMapped: boolean;
  price: number;
  priceVaries: boolean;
  prices: number[];
  totalStock: number;
  imageUrls: string[];
  mainImageUrl: string;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  variants: TikTokParsedVariant[];
  singleDimVariation: boolean;
  suggestedSingleVariationAs: SingleVariationAs;
  duplicate: {
    matchedBy: "product_id" | "seller_sku" | null;
    felioraProductId: number | null;
  };
  defaultAction: TikTokImportAction;
};

export type TikTokImportSelection = {
  tiktokProductId: string;
  action: TikTokImportAction;
  categoryId: string | null;
  singleVariationAs: SingleVariationAs;
};

export type TikTokImageMap = Record<string, string>;

export type TikTokRemotePayload = {
  source: "xlsx";
  sourceImageUrls: string[];
  imageMap: TikTokImageMap;
};

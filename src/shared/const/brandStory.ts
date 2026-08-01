/** Mídia da seção "Nossa história" (Storage: story-videos). */

export const BRAND_STORY_BUCKET = "story-videos";
export const BRAND_STORY_FOLDER = "apresentacao";
export const BRAND_STORY_FILENAME = "feliora-apresentacao.mp4";
export const BRAND_STORY_OBJECT_PATH = `${BRAND_STORY_FOLDER}/${BRAND_STORY_FILENAME}`;

export const BRAND_STORY_ATELIER_FOLDER = "atelier";

export type BrandStoryMedia = {
  type: "image" | "video";
  path: string;
  alt: string;
  /** Clipe sem faixa de áudio — nunca oferecer unmute. */
  silent?: boolean;
};

/** Bastidores do atelier — colagem / varal nas laterais. */
export const BRAND_STORY_ATELIER_MEDIA: BrandStoryMedia[] = [
  {
    type: "image",
    path: `${BRAND_STORY_ATELIER_FOLDER}/atelier-01.webp`,
    alt: "Modelagem de peça no atelier Feliora",
  },
  {
    type: "image",
    path: `${BRAND_STORY_ATELIER_FOLDER}/atelier-02.webp`,
    alt: "Moldes de papel sobre o tecido",
  },
  {
    type: "video",
    path: `${BRAND_STORY_ATELIER_FOLDER}/atelier-clip-a.mp4`,
    alt: "Bastidores do processo criativo",
    silent: true,
  },
  {
    type: "image",
    path: `${BRAND_STORY_ATELIER_FOLDER}/atelier-03.webp`,
    alt: "Detalhe do molde com anotações à mão",
  },
  {
    type: "image",
    path: `${BRAND_STORY_ATELIER_FOLDER}/atelier-04.webp`,
    alt: "Mãos cortando e posicionando o tecido",
  },
  {
    type: "video",
    path: `${BRAND_STORY_ATELIER_FOLDER}/atelier-clip-b.mp4`,
    alt: "Momento de criação no atelier",
    silent: true,
  },
  {
    type: "image",
    path: `${BRAND_STORY_ATELIER_FOLDER}/atelier-05.webp`,
    alt: "Tecido e molde sobre a mesa de corte",
  },
];

function publicObjectUrl(supabaseUrl: string, objectPath: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BRAND_STORY_BUCKET}/${objectPath}`;
}

export function brandStoryPublicUrl(supabaseUrl: string): string {
  return publicObjectUrl(supabaseUrl, BRAND_STORY_OBJECT_PATH);
}

export function brandStoryAtelierItems(
  supabaseUrl: string
): Array<BrandStoryMedia & { src: string }> {
  return BRAND_STORY_ATELIER_MEDIA.map((item) => ({
    ...item,
    src: publicObjectUrl(supabaseUrl, item.path),
  }));
}

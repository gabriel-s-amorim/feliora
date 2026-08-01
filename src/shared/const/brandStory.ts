/** Vídeo de apresentação da marca (formato vertical / TikTok). */
export const BRAND_STORY_BUCKET = "story-videos";
export const BRAND_STORY_FOLDER = "apresentacao";
export const BRAND_STORY_FILENAME = "feliora-apresentacao.mp4";
export const BRAND_STORY_OBJECT_PATH = `${BRAND_STORY_FOLDER}/${BRAND_STORY_FILENAME}`;

export function brandStoryPublicUrl(supabaseUrl: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BRAND_STORY_BUCKET}/${BRAND_STORY_OBJECT_PATH}`;
}

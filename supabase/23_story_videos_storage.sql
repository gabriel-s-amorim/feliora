-- Bucket público para vídeos de apresentação / stories da marca
-- Pasta esperada: apresentacao/
-- Arquivo da home: apresentacao/feliora-apresentacao.mp4

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-videos',
  'story-videos',
  true,
  52428800,
  array[
    'video/mp4',
    'video/webm',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "story_videos_public_read" on storage.objects;
create policy "story_videos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'story-videos');

-- Escrita só via service role (bypass RLS) — sem policies de insert/update públicas

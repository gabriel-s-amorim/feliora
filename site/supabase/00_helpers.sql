-- Feliora — helpers compartilhados
-- Execute no SQL Editor do Supabase (ou via CLI) na ordem numérica dos arquivos.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Schema privado para funções security definer (não exposto na Data API)
create schema if not exists private;

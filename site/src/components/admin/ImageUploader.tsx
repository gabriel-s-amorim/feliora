"use client";

import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminSpinner,
} from "@/components/admin/ui";
import { AdminApiError, adminUploadImage } from "@/lib/admin/client";

type Props = {
  folder?: "products" | "banners";
  urls: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
};

export function ImageUploader({
  folder = "products",
  urls,
  onChange,
  multiple = true,
  label = "Imagens",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setUploading(true);

    try {
      const uploaded: string[] = [];
      const list = multiple ? Array.from(files) : [files[0]];

      for (const file of list) {
        const url = await adminUploadImage(file, folder);
        uploaded.push(url);
      }

      if (multiple) {
        onChange([...urls, ...uploaded]);
      } else {
        onChange(uploaded);
      }
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Falha no upload da imagem"
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  function setAsCover(index: number) {
    if (index === 0) return;
    const next = [...urls];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--admin-ink)]">{label}</p>
        <AdminButton
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <AdminSpinner /> : <Upload className="size-4" />}
          {uploading ? "Enviando…" : "Enviar"}
        </AdminButton>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-10 text-center transition ${
          dragging
            ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]"
            : "border-[var(--admin-line)] bg-white/40 hover:border-[color-mix(in_srgb,var(--admin-accent)_45%,var(--admin-line))] hover:bg-white/70"
        }`}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
          <ImagePlus className="size-5" />
        </span>
        <span className="text-sm font-medium text-[var(--admin-ink)]">
          Arraste imagens ou clique para enviar
        </span>
        <span className="mt-1 text-xs text-[var(--admin-muted)]">
          JPG, PNG, WEBP ou GIF · convertido para WebP automaticamente
        </span>
      </button>

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      {urls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="group relative overflow-hidden rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-surface-2)] shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                {multiple && index > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAsCover(index)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/95 px-2 py-1.5 text-[10px] font-medium text-[var(--admin-ink)]"
                  >
                    <Star className="size-3" />
                    Capa
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 px-2 py-1.5 text-[10px] font-medium text-[var(--admin-danger)]"
                >
                  <Trash2 className="size-3" />
                  Remover
                </button>
              </div>
              {index === 0 && multiple ? (
                <span className="absolute left-2 top-2">
                  <AdminBadge tone="success">Capa</AdminBadge>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

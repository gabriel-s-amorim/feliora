import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="aspect-[3/4] bg-ivory" />
      <div className="mt-3 h-3 w-2/3 bg-ivory" />
      <div className="mt-2 h-3 w-1/3 bg-ivory" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-8 md:grid-cols-3 md:gap-y-14 lg:grid-cols-4 lg:gap-x-10">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

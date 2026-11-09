import Image from "next/image";

export function OptimizedImage({ src, alt = "", className, sizes, width = 800, height = 600, loading = "lazy" }: { src: string; alt?: string; className?: string; sizes: string; width?: number; height?: number; loading?: "lazy" | "eager" }) {
  let canOptimize = false;
  try {
    const url = new URL(src);
    canOptimize = url.protocol === "https:" && ["firebasestorage.googleapis.com", "storage.googleapis.com"].includes(url.hostname) && !url.pathname.toLowerCase().endsWith(".svg");
  } catch { canOptimize = src.startsWith("/") && !src.startsWith("//") && !src.toLowerCase().endsWith(".svg"); }
  return <Image src={src} alt={alt} width={width} height={height} sizes={sizes} loading={loading} className={className} unoptimized={!canOptimize} />;
}

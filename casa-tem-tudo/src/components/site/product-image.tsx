import Image from "next/image";
import { clsx } from "clsx";
import { PackageSearch } from "lucide-react";

export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
  pad = "p-4",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  pad?: string;
}) {
  if (!src) {
    return (
      <div className={clsx("blueprint-grid-dark flex h-full w-full items-center justify-center bg-graphite-50", className)} role="img" aria-label={`${alt} — imagem em breve`}>
        <PackageSearch className="h-12 w-12 text-graphite-300" strokeWidth={1.4} aria-hidden="true" />
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={clsx("object-contain", pad, className)} />;
}

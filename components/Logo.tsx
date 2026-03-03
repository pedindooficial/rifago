"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  width?: number;
  height?: number;
  /** "xs" = menu/barra (bem pequena), "sm" = compacto, "md" = sidebar, "lg" = destaque */
  size?: "xs" | "sm" | "md" | "lg";
  /** Opcional: URL ou data URL de logo personalizada. Se não informado, usa /logo.png */
  imageSrc?: string;
  /** Texto alternativo / fallback quando a imagem falhar */
  alt?: string;
  /** Texto a exibir quando não conseguir carregar a imagem */
  fallbackText?: string;
};

const boxSize = {
  // xs: usado na barra superior (menu público) — ~50% maior que antes
  xs: "h-14 max-h-14 w-40 max-w-[255px]",
  sm: "h-[42px] max-h-[42px] w-44 max-w-[270px]",
  md: "h-16 max-h-16 w-56 max-w-[300px]",
  lg: "h-20 max-h-20 w-72 max-w-[360px]",
};

export default function Logo({
  href = "/",
  className = "",
  width = 200,
  height = 56,
  size = "lg",
  imageSrc,
  alt,
  fallbackText,
}: LogoProps) {
  const [erro, setErro] = useState(false);
  const boxClass = boxSize[size];
  const src = imageSrc && !erro ? imageSrc : "/logo.png";
  const label = fallbackText || alt || "Rifago";

  const conteudo = erro ? (
    <span
      className={`font-bold text-primary ${
        size === "xs" ? "text-sm" : size === "lg" ? "text-xl sm:text-2xl" : "text-lg"
      }`}
    >
      {label}
    </span>
  ) : (
    <span className={`relative block shrink-0 overflow-hidden ${boxClass} ${className}`}>
      <Image
        src={src}
        alt={alt || "Rifago"}
        fill
        sizes="150px"
        className="object-contain object-left"
        onError={() => setErro(true)}
        loading="eager"
        priority
        unoptimized
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center gap-2 shrink-0">
        {conteudo}
      </Link>
    );
  }
  return <span className="flex items-center shrink-0">{conteudo}</span>;
}

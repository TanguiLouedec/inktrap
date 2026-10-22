export interface FontPreloadProps {
  /** URL of the font file. woff2 is recommended. */
  src: string;
  /** MIME type of the file. Defaults to `"font/woff2"`. */
  type?: string;
}

/**
 * Emits `<link rel="preload" as="font">` so the font downloads before any component
 * asks for it. Render it in the document head (React 19 hoists it there automatically).
 */
export function FontPreload({ src, type = "font/woff2" }: FontPreloadProps) {
  return <link rel="preload" as="font" type={type} href={src} crossOrigin="anonymous" />;
}

/** Imperatively adds a font preload link to `document.head`. No-op on the server or if one exists. */
export function preloadFont(src: string, type = "font/woff2"): void {
  if (typeof document === "undefined") return;
  for (const link of document.head.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="font"]')) {
    if (link.getAttribute("href") === src) return;
  }
  const link = document.createElement("link");
  link.rel = "preload";
  link.setAttribute("as", "font");
  link.type = type;
  link.href = src;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

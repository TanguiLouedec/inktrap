import type { FontSource } from "@inktrapjs/react";

// Open Font License variable fonts self-hosted from public/fonts (license files sit next to each font).
// Variable faces declare their whole weight range so one file serves every weight.

/** Axes: opsz 9–144, wght 100–900, SOFT 0–100, WONK 0–1. */
export const fraunces: FontSource = {
  family: "Fraunces",
  src: "/fonts/fraunces/fraunces-latin-full-normal.woff2",
  weight: "100 900",
};

export const frauncesItalic: FontSource = {
  family: "Fraunces",
  src: "/fonts/fraunces/fraunces-latin-full-italic.woff2",
  weight: "100 900",
  style: "italic",
};

/** Axes: wght 300–700. */
export const spaceGrotesk: FontSource = {
  family: "Space Grotesk",
  src: "/fonts/space-grotesk/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
};

/** Axes: opsz 7–72, wght 200–900. */
export const literata: FontSource = {
  family: "Literata",
  src: "/fonts/literata/literata-latin-opsz-normal.woff2",
  weight: "200 900",
};

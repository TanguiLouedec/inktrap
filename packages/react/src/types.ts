// Defined in the manifest package so every inktrap package shares one contract.
export type { FaceQuery, FontManifest, FontSource } from "@inktrapjs/manifest";

export type FontStatus = "loading" | "loaded" | "error";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { resetFontCache } from "../src/fontCache";
import { installFontMocks } from "./fontMocks";

// Node-environment tests (SSR) run without a DOM.
if (typeof document !== "undefined") {
  installFontMocks();

  afterEach(() => {
    cleanup();
    resetFontCache();
    installFontMocks();
  });
}

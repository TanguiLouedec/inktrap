---
"@inktrapjs/manifest": patch
---

`FontSource.display` no longer depends on the DOM's global `FontDisplay` type, so the manifest types also check in Node-only projects. `FontDisplay` is exported, with the same values.

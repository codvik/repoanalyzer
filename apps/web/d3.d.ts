// Minimal type shim for the `d3` umbrella package.
//
// The `d3` meta-package does not ship TypeScript declarations by default.
// We use it for client-only visualization code; treating it as `any` is fine here.
declare module "d3";


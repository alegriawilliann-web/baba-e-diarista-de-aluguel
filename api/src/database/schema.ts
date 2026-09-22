// Barrel file: re-exports every module's Drizzle table definitions so
// drizzle-kit has one entry point and cross-module joins can import tables
// from here instead of reaching into other modules' folders directly.
//
// Each checkpoint appends its module's export line here as it's built.

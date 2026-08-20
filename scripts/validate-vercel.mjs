import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
if (config.builds || config.routes) {
  throw new Error("explicit builders/routes must be absent so Vercel can auto-detect api functions");
}
if (config.outputDirectory !== "dist/public") {
  throw new Error("outputDirectory must remain dist/public");
}
const spaRewrite = config.rewrites?.find((rewrite) => rewrite.destination === "/index.html");
if (!spaRewrite || !spaRewrite.source.includes("api")) {
  throw new Error("API-safe SPA rewrite missing");
}
console.log("automatic Vercel functions config valid");

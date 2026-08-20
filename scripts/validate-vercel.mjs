import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
if (!Array.isArray(config.builds) || config.builds[0]?.use !== "@vercel/node") {
  throw new Error("explicit node builder missing");
}
if (config.builds[0]?.config?.includeFiles?.includes("server/**") !== true) {
  throw new Error("server includeFiles missing");
}
console.log("explicit Vercel builders config valid");

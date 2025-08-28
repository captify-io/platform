import baseConfig from "../../tsup.config.base.js";

export default {
  ...baseConfig,
  entry: ["src/index.ts"], // override entry for this package
  platform: "node", // this one is server-only
  target: "node18",
};

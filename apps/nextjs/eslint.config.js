import baseConfig, { restrictEnvAccess } from "@mindworld/eslint-config/base";
import nextjsConfig from "@mindworld/eslint-config/nextjs";
import reactConfig from "@mindworld/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  //======================================//
  // Reference: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
  // FIXME: For testing we have disabled the "any" type issues
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  //======================================//
];

export default eslintConfig;

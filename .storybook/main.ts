import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test",
    "@storybook/addon-themes"
  ],
  "framework": {
    "name": "@storybook/nextjs", // changed this from experimental version experimental-nextjs-vite.
    "options": {}
  },
  "staticDirs": [
    "../public"
  ]
};
export default config;
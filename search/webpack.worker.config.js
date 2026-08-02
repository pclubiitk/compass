const path = require("path");
const webpack = require("webpack");

// Load environment variables from your .env file
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

module.exports = {
  mode: "production",
  target: "webworker",

  entry: "./src/lib/workers/data_worker.ts",

  output: {
    path: path.resolve(__dirname, "public/workers"),
    filename: "data_worker.js",
  },

  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      // Tells Webpack how to resolve the '@' alias
      "@": path.resolve(__dirname, "src/"),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      // Workers are built outside Next.js, so Next cannot inline public env
      // variables for them. Never leave a runtime `process` reference in the
      // browser worker bundle.
      "process.env.NEXT_PUBLIC_MAPS_DOMAIN": JSON.stringify(
        process.env.NEXT_PUBLIC_MAPS_DOMAIN || "http://localhost:3001",
      ),
    }),
  ],
};

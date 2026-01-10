const path = require("path");
const webpack = require("webpack");

// Load environment variables from your .env file
// require("dotenv").config({ path: path.resolve(__dirname, ".env") });

module.exports = {
  mode: "development",
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
  // plugins: [
  //   new webpack.DefinePlugin({
  //     // This tells Webpack to find all instances of 'process.env.VARIABLE_NAME' and replace them with the actual value.
  //     "process.env.NEXT_PUBLIC_SEARCH_URL": JSON.stringify(
  //       process.env.NEXT_PUBLIC_SEARCH_URL
  //     ),
  //   }),
  // ],
};

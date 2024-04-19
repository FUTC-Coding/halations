const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
  entry: ["./src/index.js", "./src/site.js"],
  plugins: [
    new HtmlWebpackPlugin({
      title: "FUTC's Halationify",
      favicon: "./src/favicon.png",
    }),
    new MiniCssExtractPlugin(),
  ],
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  mode: "production",
  devtool: "source-map",
  devServer: {
    static: "./dist",
  },
  experiments: {
    syncWebAssembly: true,
  },
  optimization: {
    minimizer: [new CssMinimizerPlugin()],
  },
};

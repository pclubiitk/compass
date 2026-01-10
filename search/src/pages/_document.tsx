import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="bg-gradient-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

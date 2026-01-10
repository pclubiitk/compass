import type { AppProps } from "next/app";
import "@/styles/styles.css";
import "@/styles/globals.css";
import Head from "next/head";
import { GlobalContextProvider } from "@/components/ContextProvider";
import { ThemeProvider } from "next-themes";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Student Search | IITK</title>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <GlobalContextProvider>
          <Component {...pageProps} />
        </GlobalContextProvider>
      </ThemeProvider>
    </>
  );
}

import type { AppProps } from "next/app";
import "@/styles/styles.css";
import "@/styles/globals.css";
import Head from "next/head";
import { GlobalContextProvider, useGContext } from "@/components/ContextProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import{Heart} from "lucide-react";

function AppWrapper({ Component, pageProps }: AppProps) {
  const { isPuppyLove } = useGContext();

  return (
    <div
      className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${
        isPuppyLove ? "puppy-love-mode" : ""
      }`}
    >
      {isPuppyLove && (
        <div className="hearts-container pointer-events-none fixed inset-0 z-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="heart-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            >
               <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10">
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <>
      <Head>
        <title>Student Search | IITK</title>
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/16x16.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

     <ThemeProvider>
  <GlobalContextProvider>
    <AppWrapper {...props} />
  </GlobalContextProvider>
</ThemeProvider>

    </>
  );
}

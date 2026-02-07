import type { AppProps } from "next/app";
import "@/styles/styles.css";
import "@/styles/globals.css";
import Head from "next/head";
import { GlobalContextProvider, useGContext } from "@/components/ContextProvider";
import { ThemeProvider } from "next-themes";
import{Heart} from "lucide-react";
import { PuppyLoveHeartsCard } from "@/components/puppy-love/HeartsCard";


function randomHeartProps(i: number) {
  // More variety in size, color, and animation
  const sizes = ["w-5 h-5", "w-6 h-6", "w-7 h-7", "w-8 h-8"];
  const colors = [
    "text-pink-400",
    "text-pink-500",
    "text-rose-400",
    "text-rose-500",
    "text-fuchsia-400",
    "text-fuchsia-500"
  ];
  return {
    size: sizes[Math.floor(Math.random() * sizes.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${5 + Math.random() * 5}s`,
    opacity: 0.7 + Math.random() * 0.3,
    rotate: Math.random() > 0.5 ? "rotate-[10deg]" : "-rotate-[12deg]",
    blur: Math.random() > 0.7 ? "blur-[1.5px]" : ""
  };
}

// TODO: Exract out this later.
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
          {[...Array(22)].map((_, i) => {
            const props = randomHeartProps(i);
            return (
              <div
                key={i}
                className={`heart-particle ${props.size} ${props.rotate} ${props.blur}`}
                style={{
                  left: props.left,
                  opacity: props.opacity,
                  animationDelay: props.animationDelay,
                  animationDuration: props.animationDuration,
                }}
              >
                <Heart className={`${props.size} ${props.color} drop-shadow-[0_0_6px_rgba(255,0,128,0.25)] animate-pulse`} />
              </div>
            );
          })}
          {/* Occasional floating/fading hearts for extra flair */}
          {[...Array(4)].map((_, i) => (
            <div
              key={"float-"+i}
              className="heart-float-particle w-10 h-10 absolute"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${Math.random() * 80}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${6 + Math.random() * 6}s`,
                opacity: 0.5 + Math.random() * 0.5,
              }}
            >
              <Heart className="w-10 h-10 text-pink-300/70 animate-none" />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 w-full h-full">
        {/* Main content stays centered, Puppy Love card floats as overlay */}
        <Component {...pageProps} />
        {isPuppyLove && (
          <div className="hidden md:block fixed top-6 left-6 z-50">
            <PuppyLoveHeartsCard compact />
          </div>
        )}
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
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        forcedTheme="system"
      >
        <GlobalContextProvider>
          <AppWrapper {...props} />
        </GlobalContextProvider>
      </ThemeProvider>
    </>
  );
}

import { useState } from "react";
import { Info, User, Heart } from "lucide-react";
import { InfoCard } from "./cards/InfoCard";
import { CardDescription, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PROFILE_POINT } from "@/lib/constant";
import { useGContext } from "./ContextProvider";

interface NavBarProps {
  length: number;
  pos: number;
  isPLseason: boolean;
  displayInfo: (item: any) => void;
}

export const NavBar = (props: NavBarProps) => {
  const { isPuppyLove, setIsPuppyLove } = useGContext();
  const [showPassModal, setShowPassModal] = useState(false);
  const [password, setPassword] = useState("");

  const handleToggle = () => {
    if (isPuppyLove) setIsPuppyLove(false);
    else setShowPassModal(true);
  };

  const checkPassword = () => {
    if (password === "pclub") {
      setIsPuppyLove(true);
      setShowPassModal(false);
      setPassword("");
    } else {
      alert("Wrong password!");
    }
  };

  return (
    <>
      <Card 
        className={`p-2 sticky top-4 z-40 w-4/5 max-w-4xl m-auto mt-4 flex flex-row justify-between items-center transition-all duration-500 border-none
        ${isPuppyLove 
          ? 'bg-rose-50/90 shadow-[0_10px_40px_rgba(225,29,72,0.15)] backdrop-blur-md' 
          : 'bg-[#121212] shadow-2xl'}`}
      >
        {/* Left Side: Results Counter */}
        <CardDescription className={`flex flex-row items-center px-4 font-medium transition-colors duration-500 ${isPuppyLove ? 'text-rose-500' : 'text-stone-400'}`}>
          <span className="hidden sm:inline">Showing{"\u00A0"}</span>
          <span className="text-sm">
            {Math.min(props.pos, props.length)} of {props.length}
            {props.length === 1 ? " result" : " results"}
          </span>
        </CardDescription>

        {/* Right Side: Actions & Logos */}
        <div className="flex flex-row gap-1 sm:gap-2 items-center pr-2">
          {/* Main Logo */}
          <Link href="https://pclub.in" className="hover:opacity-80 transition-opacity">
            <Image
              src={"/icons/logo.png"}
              className="rounded-full border border-stone-800"
              alt="Pclub Logo"
              width={32}
              height={32}
            />
          </Link>

          {/* Puppy Love Feature */}
          {/* {props.isPLseason && (
            <div className="relative flex items-center">
               <Image
                src={"/icons/puppyLoveLogo.png"}
                className={`rounded-full cursor-pointer transition-all duration-300 transform hover:scale-110 
                `}
                alt="Puppy Love"
                width={32}
                height={32}
                onClick={handleToggle}
              />
            </div>
          )} */}

          {/* Divider */}
         

          {/* Info Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => props.displayInfo(<InfoCard />)}
          >
            <Info className="h-[1.1rem] w-[1.1rem]" />
          </Button>

          {/* Profile Link */}
          <Link href={PROFILE_POINT}>
            <Button 
              variant="ghost" 
              size="icon"
            >
              <User className="h-[1.1rem] w-[1.1rem]" />
            </Button>
          </Link>
        </div>
      </Card>


      {showPassModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <Card className="relative w-full max-w-[20rem] overflow-hidden border-none bg-white p-8 shadow-2xl rounded-[2.5rem] text-center flex flex-col items-center transform animate-in zoom-in-95 duration-300">
            
            <div className="absolute -top-12 -left-12 h-32 w-32 bg-rose-50 rounded-full blur-2xl" />

            <div className="relative mb-6">
              <div className="h-24 w-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg rotate-3 bg-stone-50">
                <Image 
                  src="/icons/puppyLoveLogo.png" 
                  alt="Puppy" 
                  fill
                  className="object-contain p-3"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-rose-500 p-2 rounded-full shadow-md border-2 border-white">
                <Heart className="h-3.5 w-3.5 text-white fill-white" />
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <p className="text-[0.7rem] text-rose-400 font-bold uppercase tracking-[0.2em]">Private Access</p>
              <p className="text-stone-500 text-sm font-medium">Enter code to unlock</p>
            </div>
            
            <div className="w-full space-y-3">
              <input 
                type="password" 
                autoFocus
                className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-xl text-center text-rose-600 placeholder-stone-300 focus:bg-white focus:border-rose-200 focus:outline-none transition-all duration-300 text-lg tracking-[0.4em]"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
              />

              <Button 
                className="w-full py-6 bg-stone-900 hover:bg-rose-600 text-white rounded-xl font-bold transition-all active:scale-95"
                onClick={checkPassword}
              >
               Submit
              </Button>
              <button 
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium"
                onClick={() => setShowPassModal(false)}
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
import { useState } from "react";
import { Info, User } from "lucide-react";
import { InfoCard } from "./cards/InfoCard";
import { CardDescription, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PROFILE_POINT } from "@/lib/constant";
import { useGContext } from "./ContextProvider";
import { PuppyLoveHeartsCard } from "@/components/PuppyLoveHeartsCard";
import { PuppyLovePasswordCard } from "./PuppyLovePasswordCard";

interface NavBarProps {
  length: number;
  pos: number;
  isPLseason: boolean;
  displayInfo: (item: any) => void;
}

export const NavBar = (props: NavBarProps) => {
  const { isPuppyLove, setIsPuppyLove } = useGContext();
  const [showPassModal, setShowPassModal] = useState(false);

  const handleToggle = () => {
    if (isPuppyLove) setIsPuppyLove(false);
    else setShowPassModal(true);
  };

  const handlePasswordSuccess = () => {
    setIsPuppyLove(true);
    setShowPassModal(false);
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
          {props.isPLseason && (
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
          )}

          {/* Divider */}
         

          {/* Info Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => props.displayInfo(<InfoCard />)}
            className="info-btn"
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

      {/* Puppy Love Hearts Card just below NavBar in mobile view */}
      {isPuppyLove && (
        <div className="block md:hidden w-full flex justify-center mt-2">
          <PuppyLoveHeartsCard compact />
        </div>
      )}

      {showPassModal && (
        <PuppyLovePasswordCard 
          onSuccess={handlePasswordSuccess}
          onCancel={() => setShowPassModal(false)}
        />
      )}
    </>
  );
};
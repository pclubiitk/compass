import { useState } from "react";
import { Info, User, BarChart3 } from "lucide-react";
import { CardDescription, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PROFILE_POINT } from "@/lib/constant";
import { useGContext } from "./ContextProvider";
import { PuppyLoveHeartsCard } from "@/components/puppy-love/HeartsCard";
import { PuppyLovePasswordCard } from "@/components/puppy-love/PasswordCard";
import { PuppyLoveSelectionsPanel } from "./puppy-love/SelectionsPanel";

// NOTE:
// 1. At one place have used Showing{"\u00A0"} to add the " " space char.

interface NavBarProps {
  length: number;
  pos: number;
  isPLseason: boolean;
  displayInfo: (item: any) => void;
}

export const NavBar = (props: NavBarProps) => {
  const router = useRouter();
  const {
    isPuppyLove,
    setIsPuppyLove,
    PLpermit,
    showSelections,
    setShowSelections,
  } = useGContext();
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
        className={`p-2 w-4/5 sticky top-2 z-10 max-w-4xl m-auto flex flex-row justify-between items-center transition-all duration-500 border-none mt-4
        ${isPuppyLove && "bg-rose-50/90 shadow-[0_10px_40px_rgba(225,29,72,0.15)] backdrop-blur-md"}`}
      >
        {/* Left Side: Results Counter */}
        <CardDescription
          className={`flex flex-row items-center px-4 font-medium transition-colors duration-500 ${isPuppyLove ? "text-rose-500" : "text-stone-400"}`}
        >
          {isPuppyLove && !PLpermit ? (
            <span className="hidden sm:inline">My Matches</span>
          ) : (
            <>
              <span className="hidden sm:inline">Showing{"\u00A0"}</span>
              <span className="text-sm">
                {Math.min(props.pos, props.length)} of {props.length}
                {props.length === 1 ? " result" : " results"}
              </span>
            </>
          )}
        </CardDescription>

        {/* Right Side: Actions & Logos */}
        <div className="flex flex-row gap-1 sm:gap-2 items-center pr-2">
          {/* Main Logo */}
          <Link
            href="https://pclub.in"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src={"/icons/logo.png"}
              className="rounded-full"
              alt="Pclub Logo"
              width={36}
              height={36}
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
                width={36}
                height={36}
                onClick={handleToggle}
              />
            </div>
          )}

          {/* Divider */}

          {/* Stats Button - Only visible when PuppyLove is active */}
          {isPuppyLove && (
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full border cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-500"
              onClick={() => router.push("/stats")}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="sr-only">View PuppyLove Stats</span>
            </Button>
          )}

          {/* Info Button */}
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full border cursor-pointer"
            onClick={() => router.push("/info")}
          >
            <Info />
          </Button>
          <Link href={PROFILE_POINT}>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full border cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span className="sr-only">Go to Profile</span>
            </Button>
          </Link>
        </div>
      </Card>
      {showPassModal && (
        <PuppyLovePasswordCard
          onSuccess={handlePasswordSuccess}
          onCancel={() => setShowPassModal(false)}
        />
      )}
      {/* Puppy Love Hearts Card above NavBar*/}
      {isPuppyLove ? (
        <div className="w-4/5 max-w-4xl m-auto flex justify-center mt-4">
          <PuppyLoveHeartsCard />
        </div>
      ) : null}
      {/* Puppy Love Selections Panel hearts card */}
      {isPuppyLove && showSelections ? (
        <div className="w-4/5 max-w-4xl m-auto mt-4 bg-white rounded-lg">
          <PuppyLoveSelectionsPanel onClose={() => setShowSelections(false)} />
        </div>
      ) : null}
    </>
  );
};

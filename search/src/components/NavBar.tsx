import { Info, User } from "lucide-react";
import { InfoCard } from "./cards/InfoCard";
import { CardDescription, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PROFILE_POINT } from "@/lib/constant";

// NOTE:
// 1. At one place have used Showing{"\u00A0"} to add the " " space char.

interface NavBar {
  length: number;
  pos: number;
  isPLseason: boolean;
  displayInfo: (item: any) => void;
}

export const NavBar = (props: NavBar) => {
  return (
    <Card className="p-2 text-center text-sm text-muted-foreground sticky top-2 z-1 w-4/5 max-w-4xl m-auto mt-4 flex flex-row justify-between">
      <CardDescription className="mt-2 flex flex-row">
        <span className="hidden sm:inline">Showing{"\u00A0"}</span>
        <span>
          {Math.min(props.pos, props.length)} of {props.length}
          {props.length === 1 ? " result" : " results"}
        </span>
      </CardDescription>

      <div className="flex flex-row gap-2">
        <Link href="https://pclub.in" className="hover:shadow rounded-full">
          <Image
            src={"/icons/logo.png"}
            className="rounded-full"
            alt="Pclub Logo"
            width={36}
            height={36}
          />
        </Link>
        {props.isPLseason && (
          <Image
            src={"/icons/puppyLoveLogo.png"}
            className="rounded-full cursor-pointer hover:shadow"
            alt="Puppy Love Logo"
            width={36}
            height={36}
            onClick={() => {}}
          />
        )}
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full border cursor-pointer"
          onClick={() => props.displayInfo(<InfoCard />)}
        >
          <Info className="h-4 w-4" />
          <span className="sr-only">FAQs</span>
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
  );
};

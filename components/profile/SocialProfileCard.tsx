"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Map, LogOut } from "lucide-react";
import type { Profile } from "@/app/profile/page"; // Import the type
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGContext } from "@/components/ContextProvider";
import { ModeToggle } from "@/components/ui/mode-toggle";

// export default function Image(props: ImageProps) {
// 	return (
// 		<div style={{
// 			width:"150px",
// 			height:"150px",
// 			position:"relative",
// 			borderRadius:"100%",
// 			flexShrink:"0",
// 	backgroundImage:`url("https://home.iitk.ac.in/~${props.u}/dp"),url("https://oa.cc.iitk.ac.in/Oa/Jsp/Photo/${props.i}_0.jpg"),url("${props.g === "F" ? Female.src : Male.src}")`,
// 			backgroundPosition:"center top",
// 			backgroundSize:"cover",
// 			...props.style

// 		}} />
// 	)
// }

// TODO: Add tool tips

// TODO: Correct the image url logic
export function SocialProfileCard({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { setLoggedIn, setGlobalLoading } = useGContext();
  const logOut = async () => {
    try {
      setGlobalLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/logout`,
        { method: "GET", credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) {
        toast(data.message);
        setLoggedIn(false);
        router.replace("/login");
      }
    } catch (error) {
      toast("Something went wrong, Try again later.");
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden pt-0">
      <div
        className="h-32 md:h-40 bg-gradient-to-r 
  from-blue-100 to-teal-100 
  dark:from-slate-800 dark:to-slate-900"
      />
      <div className="flex flex-col items-center -mt-24 sm:-mt-30 p-6">
        <Avatar className="h-32 w-32 sm:h-36 sm:w-36 border-4 border-card">
          <AvatarImage
            src={`https://home.iitk.ac.in/~${profile.email.split("@")[0]}/dp`}
          />
          <AvatarFallback className="text-4xl">
            <AvatarImage
              src={`https://oa.cc.iitk.ac.in/Oa/Jsp/Photo/${profile.rollNo}_0.jpg`}
            ></AvatarImage>
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold mt-4">{profile.name}</h1>
        <p className="text-muted-foreground">{profile.email}</p>
        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => {
              router.push("https://search.pclub.in");
            }}
          >
            <Search />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            // TODO: Need to change this to the new doamin
            onClick={() => router.push("/")}
          >
            <Map />
          </Button>
          {/* Node: here in the ModeToggle, we have increased the size of icon */}
          <ModeToggle />
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={logOut}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </Card>
  );
}

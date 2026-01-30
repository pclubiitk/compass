import Image from "@/components/student/UserImage";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Student } from "@/lib/types/data";
import { cn } from "@/lib/utils";
import { Mail, Home, University, Globe, Users, Heart } from "lucide-react";
import { useGContext } from "@/components/ContextProvider";
import { prepareSendHeart, sendHeart } from "@/lib/workers/puppyLoveWorkerClient";

interface SCardProps {
  data: Student;
  pointer?: boolean;
  type: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  children?: React.ReactNode;
}

const SCard = React.forwardRef<HTMLDivElement, SCardProps>((props, ref) => {
  const { data, type, ...rest } = props;
  const { isPuppyLove, puppyLovePublicKeys, currentUserProfile, setPuppyLoveHeartsSent } = useGContext();
  const [isSendingHeart, setIsSendingHeart] = useState(false);

  const handleSendHeart = async () => {
    if (!puppyLovePublicKeys || !puppyLovePublicKeys[data.rollNo]) {
      alert("Public key not found for this user");
      return;
    }

    if (!currentUserProfile?.gender) {
      alert("Your profile gender is required to send hearts.");
      return;
    }

    setIsSendingHeart(true);
    try {
      // Prepare hearts through worker (encryption happens here)
      const heartData = await prepareSendHeart(
        puppyLovePublicKeys[data.rollNo],
        currentUserProfile.rollNo,
        data.rollNo,
        currentUserProfile.gender
      );

      // Send hearts through worker
      const result = await sendHeart({
        genderOfSender: currentUserProfile.gender,
        enc1: heartData.hearts[0].enc,
        sha1: heartData.hearts[0].sha,
        enc2: heartData.hearts[1].enc,
        sha2: heartData.hearts[1].sha,
        enc3: heartData.hearts[2].enc,
        sha3: heartData.hearts[2].sha,
        enc4: heartData.hearts[3].enc,
        sha4: heartData.hearts[3].sha,
        returnhearts: [],
      });

      if (result && result.message) {
        if (setPuppyLoveHeartsSent) {
          const newSent = [
            { recipientId: data.rollNo, recipientName: data.name },
          ];
          setPuppyLoveHeartsSent((prev: any) => {
            const updated = Array.isArray(prev) ? [...prev, ...newSent] : newSent;
            if (typeof window !== "undefined") {
              sessionStorage.setItem("puppylove_sent_hearts", JSON.stringify(updated));
            }
            return updated;
          });
        }
        alert("Heart sent successfully!");
      } else {
        alert("Error sending heart");
      }
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setIsSendingHeart(false);
    }
  };

  const cardProps = {
    ref: ref,
    key: data.rollNo,
    style: { cursor: props.pointer ? "pointer" : "auto" },
    onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.stopPropagation();
      if (props.onClick) props.onClick(event);
    },
  };

  switch (type) {
    case "big":
      return (
        <Card
          {...cardProps}
          className={cn(
            "w-87.5 p-6 flex flex-col items-center text-center transition-shadow hover:shadow-lg",
            props.pointer && "cursor-pointer",
          )}
        >
          <Image
            style={{ width: 200, height: 200 }}
            email={props.data.email}
            gender={props.data.gender}
            profilePic={"pfp/" + props.data.UserID + ".webp"}
            alt="Image of student"
          />
          <CardHeader className="p-2 pb-0 w-full">
            <CardTitle className="text-2xl capitalize">{data.name}</CardTitle>
            <CardDescription>{data.rollNo}</CardDescription>
            <CardDescription>{`${data.course}, ${data.dept}`}</CardDescription>
          </CardHeader>

          <CardContent className="w-full mt-auto pt-6 text-left">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <University className="h-5 w-5 shrink-0" />
                <span>{`${data.hall || "Not Provided"} ${data.roomNo ? "," : ""} ${data.roomNo}`}</span>
              </div>
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 shrink-0" />
                <span>{data.homeTown || "Not Provided"}</span>
              </div>
              {data.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0" />
                  <a
                    href={`mailto:${data.email}`}
                    className="truncate hover:underline"
                  >
                    {data.email}
                  </a>
                </div>
              )}
            </div>
          </CardContent>

          <CardContent className="w-full p-0 space-y-2">
            <a
              href={`https://home.iitk.ac.in/~${data.email.split("@")[0]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                <Globe className="mr-2 h-4 w-4" /> Visit Homepage
              </Button>
            </a>
            {isPuppyLove && (
              <Button 
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendHeart();
                }}
                disabled={isSendingHeart}
              >
                <Heart className="w-4 h-4 mr-2 fill-white" />
                {isSendingHeart ? "Sending..." : "Send Heart"}
              </Button>
            )}
            {props.children}
          </CardContent>
        </Card>
      );

    case "normal":
    case "self":
    default:
      return (
        <Card
          {...cardProps}
          className={cn(
            "w-full max-w-xs p-2 flex items-center transition-shadow hover:shadow-md flex-row align-top",
            props.pointer && "cursor-pointer",
            type === "self" && "dark:border-amber-500 light: ",
          )}
        >
          <Image
            style={{ width: 150, height: 150 }}
            email={props.data.email}
            gender={props.data.gender}
            profilePic={"pfp/" + props.data.UserID + ".webp"}
            alt="Image of student"
          />
          <CardHeader className="w-full px-0">
            <CardTitle className="text-xl wrap-break-word capitalize">
              {data.name}
            </CardTitle>
            <CardDescription>{data.rollNo}</CardDescription>
            <CardDescription>{`${data.course}, ${data.dept}`}</CardDescription>
          </CardHeader>
        </Card>
      );
  }
});

SCard.displayName = "StudentCard";

export default SCard;

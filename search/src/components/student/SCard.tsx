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
import { cn, convertToTitleCase } from "@/lib/utils";
import { Mail, Home, University, Globe, Heart } from "lucide-react";
// FIXME:(ppy) Module '"@/components/ContextProvider"' declares 'receiverIds' locally, but it is not exported.
import { useGContext, receiverIds } from "@/components/ContextProvider";
import {
  prepareSendHeart,
  sendHeart,
  sendVirtualHeart,
  fetchPublicKeys,
} from "@/lib/workers/puppyLoveWorkerClient";
import { toast } from "sonner";
import { returnHeartsHandler } from "@/lib/workers/utils";

interface SCardProps {
  data: Student;
  pointer?: boolean;
  type: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  children?: React.ReactNode;
}

const SCard = React.forwardRef<HTMLDivElement, SCardProps>((props, ref) => {
  const { data, type, ...rest } = props;
  data.name = convertToTitleCase(data.name);
  data.email = data.email.startsWith("cmhw_") ? "Not Provided" : data.email;

  const {
    isPuppyLove,
    puppyLovePublicKeys,
    currentUserProfile,
    puppyLoveProfile,
    puppyLoveAllUsersData,
    privateKey,
    setStudentSelection,
  } = useGContext();

  // Get interests and bio from global context (cached in localStorage)
  const userInterests = puppyLoveAllUsersData?.interests?.[data.rollNo];
  const userAbout = puppyLoveAllUsersData?.about?.[data.rollNo];

  const [isSendingHeart, setIsSendingHeart] = useState(false);

  const handleSendHeart = async () => {
    const activeProfile = isPuppyLove && puppyLoveProfile ? puppyLoveProfile : currentUserProfile;
    const senderRollNo = (isPuppyLove && puppyLoveProfile?.rollNo) || currentUserProfile?.rollNo;
    if (setStudentSelection) {
      setStudentSelection(data);
    }
    // Block if sender's rollNo matches displayed card's rollNo
    if (senderRollNo === data.rollNo) {
      toast.error("You cannot send a heart to yourself!");
      return;
    }

    // Check if already sent a heart to this person (check receiverIds array)
    if (receiverIds.includes(data.rollNo)) {
      toast.error("You have already sent a heart to this user.");
      return;
    }

    // Validate gender - be more flexible with the check
    const userGender = activeProfile?.gender?.trim();
    if (!userGender) {
      toast.error(
        "Your profile gender is required to send hearts. Please update your profile and try again.",
      );
      return;
    }

    if (!activeProfile?.id) {
      alert("Your PuppyLove profile data is not available. Please try again.");
      return;
    }

    // Get sender's public key and private key from session
    // DONE(ppy): here the use of the keys.
    const senderPublicKey = puppyLovePublicKeys?.[activeProfile.id];
    const senderPrivateKey = privateKey;
    if (!senderPublicKey || !senderPrivateKey) {
      toast.error(
        "Your keys are not available. Please log in to PuppyLove first.",
      );
      return;
    }

    // Lazy-load: Check if receiver's public key is in global context
    let receiverPublicKey = puppyLovePublicKeys?.[data.rollNo];

    // If not in global context, fetch from server
    if (!receiverPublicKey) {
      setIsSendingHeart(true);
      try {
        await fetchPublicKeys();
        receiverPublicKey = puppyLovePublicKeys?.[data.rollNo];
        if (!receiverPublicKey) {
          toast.error("Public key not found for this user");
          setIsSendingHeart(false);
          return;
        }
      } catch (err) {
        toast.error("Failed to fetch public keys: " + (err as Error).message);
        setIsSendingHeart(false);
        return;
      }
    }

    setIsSendingHeart(true);

    try {
      // Find the first empty slot in receiverIds (max 4 hearts)
      const emptySlot = receiverIds.findIndex((id) => id === "");
      if (emptySlot === -1) {
        toast.error("You have already sent the maximum number of hearts (4).");
        setIsSendingHeart(false);
        return;
      }
      receiverIds[emptySlot] = data.rollNo;
      // Step 1: Prepare hearts with complete encryption (id_encrypt, sha_encrypt, enc)
      const heartData = await prepareSendHeart(
        senderPublicKey, // Your public key
        senderPrivateKey as string, // Your private key
        puppyLovePublicKeys, // Receiver's public key (guaranteed to exist)
        activeProfile.id, // Your roll number
        receiverIds, // Receiver's roll number
      );

      // send virtual heart
      const resp = await sendVirtualHeart(heartData);
      if (resp?.message) {
        toast.success(resp.message);
      }
      if (resp?.error) {
        toast.error("Error sending virtual heart: " + resp.error);
        setIsSendingHeart(false);
        return;
      }

      // Step 2: Send ACTUAL hearts (with receiver's encrypted data)
      if (currentUserProfile?.submit) {
        const returnHearts = await returnHeartsHandler(puppyLovePublicKeys);
        const result = await sendHeart({
          genderOfSender: userGender,
          enc1: heartData.hearts[0]?.encHeart ?? "", // Encrypted with receiver's public key
          sha1: heartData.hearts[0]?.shaHash ?? "", // Plain SHA hash
          enc2: heartData.hearts[1]?.encHeart ?? "",
          sha2: heartData.hearts[1]?.shaHash ?? "",
          enc3: heartData.hearts[2]?.encHeart ?? "",
          sha3: heartData.hearts[2]?.shaHash ?? "",
          enc4: heartData.hearts[3]?.encHeart ?? "",
          sha4: heartData.hearts[3]?.shaHash ?? "",
          returnhearts: returnHearts,
        });
      }
      // Notify SelectionsPanel that selections have changed
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("puppylove:draftSaved"));
      }
    } catch (err) {
      toast.error("Error: " + (err as Error));
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
            <CardTitle className="text-2xl overflow-hidden text-ellipsis capitalize">
              {data.name}
            </CardTitle>
            <CardDescription>
              {data.rollNo}
              {data.course ? ", " : ""}
              {`${data.course} ${data.dept ? "," : ""} ${data.dept}`}
            </CardDescription>
            {/* PuppyLove bio and interests - only visible in PuppyLove mode */}
            {isPuppyLove && userAbout && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {userAbout}
              </p>
            )}
            {isPuppyLove && userInterests && (
              <div className="flex flex-wrap gap-1 mt-2">
                {userInterests
                  .split(",")
                  .map((interest: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 text-xs bg-rose-100 text-rose-700 rounded-full"
                    >
                      {interest.trim()}
                    </span>
                  ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="w-full mt-auto text-left">
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
            {isPuppyLove && (
              <div className="w-full space-y-2">
                <Button
                  className="w-full bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendHeart();
                  }}
                  disabled={isSendingHeart}
                >
                  <Heart className="w-4 h-4 mr-2 fill-white" />
                  {isSendingHeart ? "Sending..." : "Send Heart"}
                </Button>
              </div>
            )}
            <a
              href={`https://home.iitk.ac.in/~${data.email.split("@")[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-st"
            >
              <Button variant="outline" className="w-full">
                <Globe className="mr-2 h-4 w-4" /> Visit Homepage
              </Button>
            </a>
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
            type === "self" &&
              "border-yellow-400 border-4 dark:border-amber-500",
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
            <CardTitle className="text-xl  overflow-hidden text-ellipsis wrap-break-word capitalize">
              {data.name}
            </CardTitle>
            <CardDescription>{data.rollNo}</CardDescription>
            <CardDescription>{`${data.course}${data.dept ? "," : ""} ${data.dept}`}</CardDescription>

            {/* PuppyLove bio and interests - only visible in PuppyLove mode */}
            {isPuppyLove && userAbout && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {userAbout}
              </p>
            )}
            {isPuppyLove && userInterests && (
              <div className="flex flex-wrap gap-1 mt-1">
                {userInterests
                  .split(",")
                  .map((interest: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-block px-1.5 py-0.5 text-xs bg-rose-100 text-rose-700 rounded-full"
                    >
                      {interest.trim()}
                    </span>
                  ))}
              </div>
            )}
          </CardHeader>
        </Card>
      );
  }
});

SCard.displayName = "StudentCard";

export default SCard;

import Image from "@/components/student/UserImage";
import React, { useState, useEffect } from "react";
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
import { prepareSendHeart, sendHeart, sendVirtualHeart, getVirtualHeartCount } from "@/lib/workers/puppyLoveWorkerClient";

interface SCardProps {
  data: Student;
  pointer?: boolean;
  type: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  children?: React.ReactNode;
}

const SCard = React.forwardRef<HTMLDivElement, SCardProps>((props, ref) => {
  const { data, type, ...rest } = props;
  const { isPuppyLove, puppyLovePublicKeys, puppyLoveHeartsSent, currentUserProfile, puppyLoveProfile, setPuppyLoveHeartsSent } = useGContext();
  const [isSendingHeart, setIsSendingHeart] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleSendHeart = async () => {
    const activeProfile = isPuppyLove && puppyLoveProfile ? puppyLoveProfile : currentUserProfile;

    // Check if trying to send heart to yourself
    if (activeProfile?.rollNo === data.rollNo) {
      alert("You cannot send a heart to yourself!");
      return;
    }

    const alreadySent = Array.isArray(puppyLoveHeartsSent) &&
      puppyLoveHeartsSent.some((h: any) => h.recipientId === data.rollNo);
    if (alreadySent) {
      alert("You have already sent a heart to this user.");
      return;
    }

    // Validate gender - be more flexible with the check
    const userGender = activeProfile?.gender?.trim();
    if (!userGender) {
      alert("Your profile gender is required to send hearts. Please update your profile and try again.");
      return;
    }

    if (!activeProfile?.id) {
      alert("Your PuppyLove profile data is not available. Please try again.");
      return;
    }

    // Get sender's public key and private key from session
    const senderPublicKey = puppyLovePublicKeys?.[activeProfile.id];
    const senderPrivateKey = typeof window !== "undefined" 
      ? sessionStorage.getItem("puppylove_encrypted_private_key") 
      : null;

    if (!senderPublicKey || !senderPrivateKey) {
      alert("Your keys are not available. Please log in to PuppyLove first.");
      return;
    }

    // Lazy-load: Check if receiver's public key is cached
    let receiverPublicKey = puppyLovePublicKeys?.[data.rollNo];
    
    // If not cached, fetch from server
    if (!receiverPublicKey) {
      setIsSendingHeart(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PUPPYLOVE_URL || "http://localhost:8080"}/api/puppylove/users/fetchPublicKeys`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const keys = await res.json();
        
        // Update localStorage and context with fresh keys
        if (typeof window !== "undefined") {
          localStorage.setItem("puppylove_public_keys", JSON.stringify(keys));
        }
        
        receiverPublicKey = keys[data.rollNo];
        
        if (!receiverPublicKey) {
          alert("Public key not found for this user");
          setIsSendingHeart(false);
          return;
        }
      } catch (err) {
        alert("Failed to fetch public keys: " + (err as Error).message);
        setIsSendingHeart(false);
        return;
      }
    }


    setIsSendingHeart(true);
    
    try {
      // Step 1: Prepare hearts with complete encryption (id_encrypt, sha_encrypt, enc)
      const heartData = await prepareSendHeart(
        senderPublicKey,           // Your public key
        senderPrivateKey as string,          // Your private key
        receiverPublicKey,  // Receiver's public key (now guaranteed to exist)
        activeProfile.rollNo, // Your roll number
        data.rollNo,              // Receiver's roll number
        userGender
      );

      // Step 2: Send ACTUAL hearts (with receiver's encrypted data)
      const result = await sendHeart({
        genderOfSender: userGender,
        enc1: heartData.hearts[0].enc,        // Encrypted with receiver's public key
        sha1: heartData.hearts[0].sha,        // Plain SHA hash
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
        alert("Heart sent successfully to " + data.name + "!");
      } else {
        alert("Failed to send heart. Please try again.");
      }
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setIsSendingHeart(false);
    }
  };

  const handleSaveDraft = async () => {
    const activeProfile = isPuppyLove && puppyLoveProfile ? puppyLoveProfile : currentUserProfile;
    console.log(activeProfile);
    console.log(activeProfile.rollNo);
    console.log(activeProfile.id);
    // Debug logging
    console.log("Active Profile:", activeProfile);
    console.log("Gender:", activeProfile?.gender);
    console.log("Gender type:", typeof activeProfile?.gender);

    // Check if trying to save draft for yourself
    if (activeProfile?.rollNo === data.rollNo) {
      alert("You cannot save a draft for yourself!");
      return;
    }

    // Fetch current draft count to check limit
    setIsSavingDraft(true);
    let currentSlots = { heart1: null, heart2: null, heart3: null, heart4: null };
    let currentCount = 0;
    const draftLimit = 4;
    
    try {
      const countResult = await getVirtualHeartCount();
      currentCount = countResult?.count || 0;
      console.log("Current draft count:", currentCount, "Limit:", draftLimit);
      
      // Check draft limit
      if (currentCount >= draftLimit) {
        alert(`You have reached the maximum limit of ${draftLimit} virtual hearts. Please submit your selections before saving more.`);
        setIsSavingDraft(false);
        return;
      }

      // Fetch existing hearts to determine which slots are occupied
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PUPPYLOVE_URL || "http://localhost:8080"}/api/puppylove/users/data`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (res.ok) {
          const userData = await res.json();
          if (userData.data) {
            const parsed = JSON.parse(userData.data);
            currentSlots = {
              heart1: parsed.heart1?.sha_encrypt || parsed.heart1?.SHA_encrypt || null,
              heart2: parsed.heart2?.sha_encrypt || parsed.heart2?.SHA_encrypt || null,
              heart3: parsed.heart3?.sha_encrypt || parsed.heart3?.SHA_encrypt || null,
              heart4: parsed.heart4?.sha_encrypt || parsed.heart4?.SHA_encrypt || null,
            };
          }
        }
      } catch (err) {
        console.warn("Could not fetch existing hearts, proceeding anyway:", err);
      }

      // Check if draft for this specific person already exists
      const draftHearts = typeof window !== "undefined" ? sessionStorage.getItem("puppylove_draft_hearts") : null;
      if (draftHearts) {
        try {
          const parsed = JSON.parse(draftHearts);
          if (Array.isArray(parsed)) {
            const alreadyExists = parsed.some((d: any) => d.rollNo === data.rollNo);
            if (alreadyExists) {
              alert(`Draft already saved in a slot for ${data.name}!`);
              setIsSavingDraft(false);
              return;
            }
          }
        } catch {
          // ignore parsing errors
        }
      }

    } catch (err) {
      console.error("Failed to fetch draft count:", err);
      alert("Error checking draft limit. Please try again.");
      setIsSavingDraft(false);
      return;
    }

    // Validate gender - be more flexible with the check
    const userGender = activeProfile?.gender?.trim();
    if (!userGender) {
      console.error("Gender validation failed. Active Profile:", activeProfile);
      alert("Your profile gender is required to save drafts. Please update your profile and try again.");
      setIsSavingDraft(false);
      return;
    }

    if (!activeProfile?.id) {
      alert("Your PuppyLove profile data is not available. Please try again.");
      setIsSavingDraft(false);
      return;
    }

    // Get sender's public key and private key from session
    const senderPublicKey = puppyLovePublicKeys?.[activeProfile.id];
    const senderPrivateKey = typeof window !== "undefined" 
      ? sessionStorage.getItem("puppylove_encrypted_private_key") 
      : null;

    console.log(senderPublicKey);
    console.log(senderPrivateKey);


    if (!senderPublicKey || !senderPrivateKey) {
      alert("Your keys are not available. Please log in to PuppyLove first.");
      setIsSavingDraft(false);
      return;
    }

    // Lazy-load: Check if receiver's public key is cached
    let receiverPublicKey = puppyLovePublicKeys?.[data.rollNo];
    
    // If not cached, fetch from server
    if (!receiverPublicKey) {
      setIsSavingDraft(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PUPPYLOVE_URL || "http://localhost:8080"}/api/puppylove/users/fetchPublicKeys`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const keys = await res.json();
        
        // Update localStorage and context with fresh keys
        if (typeof window !== "undefined") {
          localStorage.setItem("puppylove_public_keys", JSON.stringify(keys));
        }
        
        receiverPublicKey = keys[data.rollNo];
        
        if (!receiverPublicKey) {
          alert("Public key not found for this user");
          setIsSavingDraft(false);
          return;
        }
      } catch (err) {
        alert("Failed to fetch public keys: " + (err as Error).message);
        setIsSavingDraft(false);
        return;
      }
    }

    setIsSavingDraft(true);
    
    try {
      console.log("🔐 senderPublicKey exists?", !!senderPublicKey);
      console.log("🔐 senderPrivateKey exists?", !!senderPrivateKey);
      console.log("🔐 receiverPublicKey exists?", !!receiverPublicKey);
      
      // Step 1: Prepare hearts with complete encryption
      console.log("📝 Calling prepareSendHeart...");
      const heartData = await prepareSendHeart(
        senderPublicKey,
        senderPrivateKey as string,
        receiverPublicKey,
        activeProfile.rollNo,
        data.rollNo,
        activeProfile.gender
      );
      console.log("✅ prepareSendHeart succeeded");

      // Step 2: Find first empty slot and save draft there
      console.log("📤 Finding first empty slot...");
      console.log("Current slots occupied:", currentSlots);
      
      let targetSlot = null;
      if (!currentSlots.heart1) targetSlot = 'heart1';
      else if (!currentSlots.heart2) targetSlot = 'heart2';
      else if (!currentSlots.heart3) targetSlot = 'heart3';
      else if (!currentSlots.heart4) targetSlot = 'heart4';
      
      if (!targetSlot) {
        alert("All slots are full. This shouldn't happen!");
        setIsSavingDraft(false);
        return;
      }
      
      console.log("📤 Saving to slot:", targetSlot);
      
      // Build hearts object with only the target slot filled
      const heartsPayload = {
        heart1: targetSlot === 'heart1' ? {
          sha_encrypt: heartData.hearts[0].id_encrypt,
          id_encrypt: heartData.hearts[0].id_encrypt,
          songID_enc: heartData.hearts[0].song_enc || "",
        } : { sha_encrypt: "", id_encrypt: "", songID_enc: "" },
        heart2: targetSlot === 'heart2' ? {
          sha_encrypt: heartData.hearts[0].id_encrypt,
          id_encrypt: heartData.hearts[0].id_encrypt,
          songID_enc: heartData.hearts[0].song_enc || "",
        } : { sha_encrypt: "", id_encrypt: "", songID_enc: "" },
        heart3: targetSlot === 'heart3' ? {
          sha_encrypt: heartData.hearts[0].id_encrypt,
          id_encrypt: heartData.hearts[0].id_encrypt,
          songID_enc: heartData.hearts[0].song_enc || "",
        } : { sha_encrypt: "", id_encrypt: "", songID_enc: "" },
        heart4: targetSlot === 'heart4' ? {
          sha_encrypt: heartData.hearts[0].id_encrypt,
          id_encrypt: heartData.hearts[0].id_encrypt,
          songID_enc: heartData.hearts[0].song_enc || "",
        } : { sha_encrypt: "", id_encrypt: "", songID_enc: "" },
      };
      
      const result = await sendVirtualHeart({ hearts: heartsPayload });

      console.log("💾 Save draft result:", result);
      console.log("💾 Result type:", typeof result);
      console.log("💾 Result keys:", result ? Object.keys(result) : "null");
      
      if (result) {
        // Store draft recipient locally for selections panel
        if (typeof window !== "undefined") {
          try {
            const stored = sessionStorage.getItem("puppylove_draft_hearts");
            const parsed = stored ? JSON.parse(stored) : [];
            const drafts = Array.isArray(parsed) ? parsed : [];

            const exists = drafts.some((d: any) => d.rollNo === data.rollNo);
            if (!exists) {
              drafts.push({
                rollNo: data.rollNo,
                name: data.name,
                dept: data.dept,
                course: data.course,
                hall: data.hall,
                email: data.email,
                gender: data.gender,
              });
              sessionStorage.setItem("puppylove_draft_hearts", JSON.stringify(drafts));
            }
          } catch {
            // ignore storage errors
          }

          // Dispatch event to notify UI to refresh count/list
          window.dispatchEvent(new CustomEvent('puppylove:draftSaved'));
        }
        alert(result?.message || "Draft saved successfully for " + data.name + "!");
      } else if (result?.error) {
        console.error("❌ Draft save error:", result.error);
        alert("Error: " + result.error);
      } else {
        console.error("❌ Unknown result received:", JSON.stringify(result));
        alert("Failed to save draft. Result: " + JSON.stringify(result));
      }
    } catch (err) {
      console.error("❌ Exception in handleSaveDraft:", err);
      alert("Error saving draft: " + (err as Error).message);
    } finally {
      setIsSavingDraft(false);
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
              <div className="w-full space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendHeart();
                  }}
                  disabled={isSendingHeart || isSavingDraft}
                >
                  <Heart className="w-4 h-4 mr-2 fill-white" />
                  {isSendingHeart ? "Sending..." : "Send Heart"}
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveDraft();
                  }}
                  disabled={isSendingHeart || isSavingDraft}
                >
                  {isSavingDraft ? "Sending..." : "Send Virtual Heart"}
                </Button>
              </div>
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

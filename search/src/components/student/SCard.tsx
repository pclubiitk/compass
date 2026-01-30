import Image from "@/components/student/UserImage";
import React from "react";
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
import { Mail, Home, University, Globe } from "lucide-react";

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
            <CardDescription>{data.rollNo}</CardDescription>
            <CardDescription>{`${data.course} ${data.dept ? "," : ""} ${data.dept}`}</CardDescription>
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

          <CardContent className="w-full p-0">
            <a
              href={`https://home.iitk.ac.in/~${data.email.split("@")[0]}`}
              target="_blank"
              rel="noopener noreferrer"
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
            type === "self" && "border-yellow-400 border-4 dark:border-amber-500",
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
          </CardHeader>
        </Card>
      );
  }
});

SCard.displayName = "StudentCard";

export default SCard;

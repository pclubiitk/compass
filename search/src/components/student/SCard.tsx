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
import { cn } from "@/lib/utils";
import { Mail, Home, University, Globe, Users } from "lucide-react";

interface SCardProps {
  data: Student;
  pointer?: boolean;
  type: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  children?: React.ReactNode;
}

const SCard = React.forwardRef<HTMLDivElement, SCardProps>((props, ref) => {
  const { data, type, ...rest } = props;

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
            "w-[350px] p-6 flex flex-col items-center text-center transition-shadow hover:shadow-lg",
            props.pointer && "cursor-pointer"
          )}
        >
          <Image
            style={{ width: 200, height: 200 }}
            email={props.data.email}
            rollNo={props.data.rollNo}
            gender={props.data.gender}
            alt="Image of student"
          />
          <CardHeader className="p-2 pb-0 w-full">
            <CardTitle className="text-2xl">{data.name}</CardTitle>
            <CardDescription>{data.rollNo}</CardDescription>
            <CardDescription>{`${data.course}, ${data.dept}`}</CardDescription>
          </CardHeader>

          <CardContent className="w-full mt-auto pt-6 text-left">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <University className="h-5 w-5 flex-shrink-0" />
                <span>{`${data.hall}, ${data.roomNo}`}</span>
              </div>
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 flex-shrink-0" />
                <span>{data.homeTown}</span>
              </div>
              {data.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 flex-shrink-0" />
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
            type === "self" && "dark:border-amber-500 light: "
          )}
        >
          <Image
            style={{ width: 150, height: 150 }}
            email={props.data.email}
            rollNo={props.data.rollNo}
            gender={props.data.gender}
            alt="Image of student"
          />
          <CardHeader className="w-full px-0">
            <CardTitle className="text-xl wrap-break-word">
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

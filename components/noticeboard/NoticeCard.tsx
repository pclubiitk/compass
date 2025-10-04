"use client";
import * as React from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function NoticeCard({
  id,
  cardTitle,
  cardDescription,
  noticePreview,
  discription,
}: {
  id: string;
  cardTitle: string;
  cardDescription: string;
  noticePreview: string;
  discription: React.ReactNode;
}) {
  return (
    <AccordionItem id={id} value={id} className="border-0">
      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="space-y-2">
            <p>{noticePreview}</p>

            {/* Wrap Button in a div when using asChild */}
            <div
              onClick={() => {
                if (window.location.hash.substring(1) !== id) {
                  window.location.hash = id;
                  document
                    .getElementById(id)
                    ?.scrollIntoView({ behavior: "smooth" });
                } else {
                }
              }}
            >
              <AccordionTrigger>Read More</AccordionTrigger>
            </div>
          </div>

          <AccordionContent className="pt-4 px-0">
            {discription}
          </AccordionContent>
        </CardContent>
      </Card>
    </AccordionItem>
  );
}

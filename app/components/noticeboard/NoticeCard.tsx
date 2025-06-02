import * as React from "react"

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"



export function NoticeCard({value,cardTitle,cardDescription,noticePreview,discription}:{value:string,cardTitle:string,cardDescription:string,noticePreview:string,discription: React.ReactNode}) {
  return (
    <AccordionItem value={value} className="border-0">
      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="space-y-2">
            <p>{noticePreview}</p>

            {/* Wrap Button in a div when using asChild */}

              <AccordionTrigger>
                  Read More
              </AccordionTrigger>
            </div>


          <AccordionContent className="pt-4 px-0">
            {discription}
          </AccordionContent>
        </CardContent>
      </Card>
    </AccordionItem>
  )
}
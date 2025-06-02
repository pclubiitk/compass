'use client';

import { Separator } from '@/components/ui/separator'
import {  ScrollArea, ScrollBar  } from '@/components/ui/scroll-area'
import Image from 'next/image'
import ReviewCard from "@/app/components/user/ReviewCard"
import RatedStars from "@/app/components/user/RatedStars"
import RatingStars from "@/app/components/user/RatingStars"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle,
    DrawerTrigger, DrawerClose
} from "@/components/ui/drawer"
import { Textarea } from "@/components/ui/textarea"

export default function ReviewPage() {
    return (
        <div className="flex-col items-center">
            <div className="mx-auto max-w-4xl">
                <h2 className="mx-5 mb-4 mt-8 text-3xl font-bold" >Students Activity Center</h2>
                <Separator/>
                <div className="mt-4 flex items-center">
                    <p className="ml-5 text-lg">Rating: </p>
                    <RatedStars count={5} rating={4} iconSize={20} icon={''} color={''}/>
                    <p className="ms-1 text-sm font-light text-gray-500 dark:text-gray-400">(4/5)</p>
                </div>
                <p className="mx-5 my-3">
                    IIT Kanpur provides rooms for all the clubs of Students’ Gymkhana in its Student Activity Centre (SAC) which is the hub of all the extracurricular activities of students. It also houses Open Air Theatre (OAT) with a seating capacity of over 1400 people which is used in almost every inter-hall competition like Galaxy, Takneek etc.
                </p>
                <ScrollArea className="max-w-4xl border whitespace-nowrap mx-auto">
                    <ScrollBar orientation="horizontal" />
                    <div className="flex w-max space-x-4 p-4">
                        <div className="overflow-hidden rounded-md">
                            <Image
                                src = "/DSC_1035.jpeg"
                                width={300}
                                height={300}
                                className="aspect-[3/2] h-fit w-fit"
                                alt="dead"
                            />
                        </div>
                        <div className="overflow-hidden rounded-md">
                            <Image
                                src = "/images.jpeg"
                                width={3000}
                                height={3000}
                                className="h-fit w-fit"
                                alt="dead"
                            />
                        </div>
                    </div>
                </ScrollArea>
                <Separator className="my-4" />

                <div className="flex items-center">
                    <h2 className="text-2xl font-bold my-5 mx-5">Reviews</h2>
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button className="text-2xl flex p-3" size="sm" variant="outline"> + </Button>
                        </DrawerTrigger>
                            <DrawerContent>
                                <div className="mx-auto w-full max-w-sm mt-8 mb-20">
                                    <DrawerHeader>
                                        <DrawerTitle className="text-2xl">Write a Review</DrawerTitle>
                                    </DrawerHeader>
                                    <Separator/>
                                    <div className="mx-3 my-4 flex items-center">
                                        <p>Rate the place:</p>
                                        <div className="mx-2">
                                            <RatingStars count={0} defaultRating={0} iconSize={18} icon={''} color={''}/>
                                        </div>
                                    </div>
                                    <Textarea className="py-2 my-3 mx-auto max-w-90" placeholder ="Write something to let others know what you feel about this place." />
                                    <Input id="picture" type="file" className="max-w-55 mx-3 mb-3"/>
                                    <Separator className="my-4" />
                                    <Button className="mx-auto w-90 my-3 ml-3 p-6 text-lg">Post</Button>
                                    <DrawerClose asChild>
                                        <Button className="mx-auto w-90 my-0 ml-3 p-6 text-lg" variant="outline">Cancel</Button>
                                    </DrawerClose>
                                </div>
                            </DrawerContent>
                    </Drawer>
                </div>

                <ReviewCard author={"Mr. Bean"} review_body={"Very nice place. Late nights here are just THE VIBE!"} rating={4}></ReviewCard>
                <ReviewCard author={"Mr. Boon"} review_body={"Too many dogs"} rating={2}></ReviewCard>

            </div>
        </div>
    );
}

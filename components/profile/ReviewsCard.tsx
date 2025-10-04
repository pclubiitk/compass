import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import RatedStars from '@/app/components/user/RatedStars'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

import * as React from "react";
import { useRouter } from "next/navigation";

type ReviewProps = {
    locationID: string,
    rating: number,
    review_body: string,
}

export default function ReviewsCard({locationID, rating, review_body}: ReviewProps) {
    const router = useRouter();

    return (
        <Card className="mx-0 my-3 py-0 gap-0">
            <div className="mx-4 py-3">
                <div className="flex items-center mb-3 mt-2">
                    <RatedStars count={5} rating={rating} iconSize={18} color={'yellow'} icon={''}/>
                    <p className="mx-2 font-light text-xs">({rating}/5)</p>
                </div>
                <Separator/>
                <div className="flex items-center justify-between flex-row">
                    <p className="my-3">{review_body}</p>
                    <Button variant="ghost"
                            className="rounded-full h-9 w-9 mx-1"
                            onClick={() => {
                                router.push(`location/${locationID}`);
                            }}>
                        <MapPin className="!h-6 !w-6"/>
                    </Button>
                </div>
            </div>
        </Card>
    );
}
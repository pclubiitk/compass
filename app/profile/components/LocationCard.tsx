import { Card, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MapPin, Star } from 'lucide-react'

import { useRouter } from "next/navigation";

type LocationProps = {
    locationID: string,
    name: string,
    rating: number,
    description: string
    img: string
}

export default function LocationCard({locationID, name, rating, description, img}: LocationProps) {
    const router = useRouter();

    return (
        <Card className="mx-3 pt-0 gap-3 overflow-hidden rounded-2xl">
            <div className="relative h-44 w-full">
                <Image
                    src={img}
                    alt={name}
                    fill
                    className="object-cover rounded-2xl mb-0 pb-0"
                />
                {/* Floating rating badge */}
                <div className="absolute text-gray-500 bottom-3 left-3 bg-white/90 text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center">
                    <Star className="!h-4 !w-4 mr-1"/>{rating.toFixed(1)}
                </div>
            </div>
            <div>
                <div className="px-5 pb-2 mt-0">
                    <CardTitle className="text-lg font-semibold">{name}</CardTitle>
                </div>

                <Separator />

                <div className="flex flex-row justify-between pt-4 px-3">
                    <p className="text-sm leading-snug">
                        {description}
                    </p>
                    <Button
                        variant="ghost"
                        className="rounded-full h-9 w-9 mx-1"
                        onClick={() => {
                            router.push(`location/${locationID}`);
                        }}
                    >
                        <MapPin className="!h-6 !w-6" />
                    </Button>

                </div>
            </div>
        </Card>
    );

}
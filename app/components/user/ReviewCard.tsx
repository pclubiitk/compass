import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import RatedStars from './RatedStars'

type ReviewProps = {
    author: string;
    rating: number;
    review_body: string;
}

export default function ReviewCard({ author, rating, review_body }: ReviewProps) {
    return(
        <Card className="mx-3 my-3 py-0 gap-0">
            <div className="mx-4 py-3">
                <CardTitle className="text-lg py-1 my-0"> {author} </CardTitle>
                <div className="flex items-center mb-3">
                <RatedStars count={5} rating={rating} iconSize={12} icon={''} color={'yellow'}/>
                    <p className="mx-2 font-light text-xs">({rating}/5)</p>
                </div>
                <Separator/>
                <p className="my-3">{review_body}</p>
            </div>
        </Card>
    );
}
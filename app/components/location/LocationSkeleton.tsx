import { Skeleton } from "@/components/ui/skeleton";

export function LocationSkeleton() {
    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-4">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-8 w-1/3" />
                            <div className="flex space-x-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        </div>
                        <Skeleton className="h-64 md:h-80 lg:h-[500px] w-full rounded-xl" />
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-6 w-12" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="flex space-x-4 overflow-hidden">
                            <Skeleton className="h-32 w-48 rounded-lg flex-shrink-0" />
                            <Skeleton className="h-32 w-48 rounded-lg flex-shrink-0" />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mt-4">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        {[1, 2].map((i) => (
                            <div key={i} className="p-3 border rounded-xl space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

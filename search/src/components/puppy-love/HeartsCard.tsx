import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import {
  receiverIds,
  heartsReceivedFromMales,
  heartsReceivedFromFemales,
} from "@/components/ContextProvider";

export const PuppyLoveHeartsCard = () => {
  const selectionCount = receiverIds.filter((id) => id !== "").length;
  const totalReceived = heartsReceivedFromMales + heartsReceivedFromFemales;

  return (
    <Card className="h-full border-none bg-linear-to-br from-rose-50/95 to-pink-50/95 shadow-[0_10px_40px_rgba(225,29,72,0.15)] backdrop-blur-sm">
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center justify-center gap-1.5 text-rose-500 text-sm">
          <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
          Your Hearts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3 pt-0">
        {/* Selections Counter */}
        <div className="flex justify-between items-center rounded-lg px-3 py-2 bg-linear-to-r from-rose-100/90 to-pink-100/90 border border-rose-200/50">
          <span className="text-xs font-medium text-rose-600">Number of selections</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-rose-500">{selectionCount}</span>
            <span className="text-rose-400 text-sm">/4</span>
          </div>
        </div>

        {/* Hearts Received Section */}
        <div className="rounded-lg px-3 py-2 bg-linear-to-r from-rose-100/90 to-pink-100/90 border border-rose-200/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-rose-600">Received</span>
            <span className="text-lg font-bold text-rose-500">{totalReceived}</span>
          </div>
          
          {/* Male/Female Breakdown */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-md bg-blue-50/80 border border-blue-200/50 px-2 py-1.5 text-center">
              <div className="text-sm font-bold text-blue-500">{heartsReceivedFromMales}</div>
              <div className="text-[10px] text-blue-400 font-medium">♂ Males</div>
            </div>
            <div className="flex-1 rounded-md bg-pink-50/80 border border-pink-200/50 px-2 py-1.5 text-center">
              <div className="text-sm font-bold text-pink-500">{heartsReceivedFromFemales}</div>
              <div className="text-[10px] text-pink-400 font-medium">♀ Females</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

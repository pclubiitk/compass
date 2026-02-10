import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  receiverIds,
  heartsReceivedFromMales,
  heartsReceivedFromFemales,
} from "@/components/ContextProvider";

export const PuppyLoveHeartsCard = () => {
  const selectionCount = receiverIds.filter((id) => id !== "").length;
  const totalReceived = heartsReceivedFromMales + heartsReceivedFromFemales;

  return (
    <Card className="w-full border-none bg-rose-50/90 shadow-[0_10px_40px_rgba(225,29,72,0.15)]">
      <CardHeader>
        <CardTitle className="text-center text-rose-400">Your Hearts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center rounded-lg px-3 py-2 bg-rose-100/80">
          <span className="text-sm font-medium text-rose-500">Selections</span>
          <span className="font-bold text-rose-500">{selectionCount}/4</span>
        </div>

        <div className="rounded-lg px-3 py-2 bg-rose-100/80 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-rose-500">
              Hearts Received
            </span>
            <span className="font-bold text-rose-500">{totalReceived}</span>
          </div>
          {totalReceived > 0 && (
            <div className="flex gap-4 text-xs pt-1">
              <span className="text-blue-500 font-medium">
                ♂ Males: {heartsReceivedFromMales}
              </span>
              <span className="text-pink-500 font-medium">
                ♀ Females: {heartsReceivedFromFemales}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

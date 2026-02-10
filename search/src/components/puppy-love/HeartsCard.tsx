import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Image from "next/image";
import { receiverIds, heartsReceivedFromMales, heartsReceivedFromFemales, puppyLoveHeartsReceived } from "@/components/ContextProvider";

interface PuppyLoveHeartsCardProps {
  compact?: boolean;
}

export const PuppyLoveHeartsCard = ({ compact }: PuppyLoveHeartsCardProps) => {
  const selectionCount = receiverIds.filter((id) => id !== '').length;
  const totalReceived = heartsReceivedFromMales + heartsReceivedFromFemales;

  return (
    <Card
      className={`${compact ? "w-[260px]" : "w-[350px]"} border-none bg-rose-50/90 shadow-[0_10px_40px_rgba(225,29,72,0.15)]`}
    >
      <CardHeader>
        <CardTitle className="flex flex-col items-center gap-2">
          <div className="relative w-fit">
            <Image
              src="/icons/puppyLoveLogo.png"
              alt="Puppy Love"
              width={compact ? 48 : 64}
              height={compact ? 48 : 64}
              className="rounded-2xl"
            />
            {!compact && selectionCount > 0 && (
              <div className="absolute -top-2 -right-2 flex items-center justify-center bg-rose-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                {selectionCount}
              </div>
            )}
          </div>
        </CardTitle>
        <CardTitle
          className={`${compact ? "text-lg" : "text-2xl"} text-center text-rose-500`}
        >
          Puppy Love
        </CardTitle>
        <CardDescription className="text-center text-rose-400">
          Your Hearts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center rounded-lg px-3 py-2 bg-rose-100/80">
          <span className="text-sm font-medium text-rose-500">
            Selections
          </span>
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { DescriptionDetails } from "@/app/components/lib/types";

interface DialogProps{
    details: DescriptionDetails
}

export default function DialogBuilt({ details }: DialogProps) {
  return (
    <Dialog >
      <DialogTrigger className="cursor-pointer px-4 py-2 bg-sky-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition">
        Description
      </DialogTrigger>

      <DialogContent className="rounded-xl p-6 bg-white shadow-xl max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">Details</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">User:</span> {details.user}
          </div>

          <div className="text-gray-700 text-base leading-relaxed">
            <span className="font-medium text-gray-800">Body:</span> {details.body}
          </div>

          <div className="text-xs text-gray-400 text-left border-t pt-2">
            {details.date}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

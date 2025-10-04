import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeClosed, Trash } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useGContext } from "../ContextProvider";
import { toast } from "sonner";

export function AlertDeleteProfileInfo() {
  const { setGlobalLoading } = useGContext();
  const delay = (ms: number | undefined) =>
    new Promise((res) => setTimeout(res, ms));
  const deleteProfileData = async () => {
    try {
      setGlobalLoading(true);
      await delay(10000);
    } catch (error) {
      toast(
        "Unable to toggle visibility at the moment, please try again later."
      );
    } finally {
      setGlobalLoading(false);
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" onClick={() => {}}>
          <Trash />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            <span className="font-extrabold">
              This action cannot be undone.
            </span>
            <br />
            <br />
            This will permanently delete your Profile data and remove your data
            from our servers,{" "}
            <span className="font-extrabold">
              we will only hold your name & email
            </span>{" "}
            for your account.
            <br />
            <br />
            This will also delete your profile from{" "}
            <a
              className="underline"
              href="https://search.pclub.in"
              target="_blank"
              rel="noopener noreferrer"
            >
              Student Search Portal
            </a>{" "}
            (This action may take some time to reflect across all users).
            <span className="font-extrabold">
              And you will not be able to browse other profiles!
            </span>
            <br />
            <br />
            If you wish to join the community again, you will be required to
            fill in complete profile data again.
            <br />
            <br />
            Please don't go! Let us know how we can improve and why are you
            leaving 😞 over{" "}
            <a
              className="underline"
              href="mailto:pclubiitk@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              pclubiitk@gmail.com
            </a>
            <br />
            <br />
            Do you still wish to delete your profile data?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="destructive" onClick={deleteProfileData}>
              Yes
            </Button>
          </DialogClose>

          <DialogClose asChild>
            <Button
              className="bg-green-600 dark:bg-green-600 hover:bg-green-500"
              variant="destructive"
            >
              No, I will stay
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AlertVisibilityProfileInfo({
  initialVisibility,
}: {
  initialVisibility: boolean;
}) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const { setGlobalLoading } = useGContext();
  const toggleVisibility = async () => {
    try {
      setGlobalLoading(true);
      // Add your logic to toggle visibility here
      setVisibility((prev) => !prev);
    } catch (error) {
      toast(
        "Unable to toggle visibility at the moment, please try again later."
      );
    } finally {
      setGlobalLoading(false);
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => {}}>
          {visibility ? <Eye /> : <EyeClosed />}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            {visibility ? (
              <>
                This will make your profile invisible in{" "}
                <a href="search.pclub.in">Student Search Portal</a> <br />
                (This action may take some time to reflect across all users).{" "}
                <br />
                <span className="font-extrabold">
                  And you will not be able to browse other profiles!
                </span>
              </>
            ) : (
              <>
                <span className="font-extrabold">
                  This will make your profile visible in{" "}
                  <a href="search.pclub.in">Student Search Portal</a> <br />
                </span>
                (This action may take some time to reflect across all users).{" "}
                <br />
                And you can also browse other profiles!
                <br />
                <br />
                <span>
                  By clicking proceed you accept our{" "}
                  <a className="underline" href="/tnc">
                    terms and conditions
                  </a>
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="destructive"
              className={cn(
                !visibility &&
                  "dark:bg-green-600 bg-green-600 hover:bg-green-500"
              )}
              onClick={toggleVisibility}
            >
              Proceed
            </Button>
          </DialogClose>

          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

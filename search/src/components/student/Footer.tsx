import Image from "next/image";
import Link from "next/link";

export default function GuestFooter() {
  return (
    <footer className="fixed bottom-0 w-full border-t bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-8 items-center justify-center">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Family tree provided by{" "}
            <Link
              href="https://www.iitk.ac.in/counsel/"
              className="font-medium underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Institute Counselling Service IITK
            </Link>
          </p>
          <Image
            src="/cslogo.png" // Make sure this path is correct in your /public folder
            width={18}
            height={18}
            alt="Logo"
          />
        </div>
      </div>
    </footer>
  );
}

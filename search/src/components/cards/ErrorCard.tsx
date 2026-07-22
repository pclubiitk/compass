import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// TODO: Add link to the tnc, and other details
export function ErrorCard() {
  return (
    <Card className="p-4 z-10">
      <CardTitle>Data could not be retrieved locally nor fetched.</CardTitle>
      <CardDescription>
        <ol className="mb-2 list-disc ml-5">
          <li>
            <span className="font-bold">Data Fetching Error:</span> Please
            ensure your internet is working correctly
          </li>
          <li>
            <span className="font-bold">Clear Local Cache</span> You can visit
            the <Link href="/info">FAQ section</Link> and clear the local cache
            to start fresh.
          </li>
        </ol>
      </CardDescription>
    </Card>
  );
}

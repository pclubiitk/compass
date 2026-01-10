import { Card, CardDescription, CardTitle } from "@/components/ui/card";

// TODO: Add link to the tnc, and other details
export function ErrorCard() {
  return (
    <Card className="p-4 z-10">
      <CardTitle>Data could not be retrieved locally nor fetched.</CardTitle>
      <CardDescription>
        <p>
          Please access the website from campus or via VPN once so that student
          data can be downloaded and stored.
        </p>
      </CardDescription>
    </Card>
  );
}

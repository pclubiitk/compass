import { Card, CardDescription, CardTitle } from "@/components/ui/card";

// TODO: Add link to the tnc, and other details
export function ErrorCard() {
  return (
    <Card className="p-4 z-10">
      <CardTitle>Data could not be retrieved locally nor fetched.</CardTitle>
      <CardDescription>
        <ol className="mb-2 list-disc ml-5">
          <li>
            <span className="font-bold">LogIn:</span> Please Log In before, to
            access the student search.
          </li>
          <li>
            <span className="font-bold">Visibility:</span> You must make your
            profile visible to view other profiles.
          </li>
          <li>
            <span className="font-bold">Network:</span> Access the website from
            campus or via VPN at least so that student data can be downloaded
            and stored locally.
          </li>
        </ol>
      </CardDescription>
    </Card>
  );
}

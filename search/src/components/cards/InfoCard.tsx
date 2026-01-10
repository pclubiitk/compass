import {
  CardTitle,
  CardDescription,
  Card,
  CardFooter,
} from "@/components/ui/card";

export function InfoCard() {
  return (
    <Card className="p-4 z-10">
      <CardTitle className="text-2xl">FAQ&apos;s</CardTitle>
      <CardDescription>
        <CardTitle className="text-xl">Setting a custom DP</CardTitle>
        <p>
          You can customize the image shown here by placing a custom image in
          your iitk webhome folder called dp.jpg/dp.png such that going to
          http://home.iitk.ac.in/~yourusername/dp opens up that particular
          picture.
        </p>
        <br />
        <CardTitle className="text-xl">
          I can&apos;t see students&apos; pictures or I can &apos;t access
          student data.
        </CardTitle>
        <p>
          Access to student data is restricted to those currently on campus or
          connecting via VPN. You should be logged into your Pclub Account, And
          to view other profiles, you are required to keep your profile public
        </p>
        <br />
        <CardFooter className="italic">
          <p className="text-end w-full">
            Credit for Student Guide data (bacche, ammas and baapus) goes to the{" "}
            <a className="underline hover:no-underline"  href="https://www.iitk.ac.in/counsel/">
              Counselling Service, IITK.
            </a>
          </p>
        </CardFooter>
      </CardDescription>
    </Card>
  );
}

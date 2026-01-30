import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ComingSoon from "@/components/ui/ComingSoon";

// Static team data for 2025
const TEAM_MEMBERS = [
  {
    rollNo: "230626",
    name: "Manas Jain Kuniya",
    imageUrl: "https://github.com/identicons/user1.png",
  },
  {
    rollNo: "240539",
    name: "Ketan",
    imageUrl: "https://github.com/identicons/user2.png",
  },
  {
    rollNo: "240669",
    name: "Muragesh Channappa Nyamagoud",
    imageUrl: "https://github.com/identicons/user3.png",
  },
  {
    rollNo: "240876",
    name: "Ritika Batra",
    imageUrl: "https://github.com/identicons/user4.png",
  },
  {
    rollNo: "240980",
    name: "Shivang Dixit",
    imageUrl: "https://github.com/identicons/user5.png",
  },
  {
    rollNo: "240981",
    name: "Shivansh Jaiswal",
    imageUrl: "https://github.com/identicons/user6.png",
  },
  {
    rollNo: "240979",
    name: "Shivam Sah",
    imageUrl: "https://github.com/identicons/user7.png",
  },
  {
    rollNo: "241118",
    name: "Utkarsh Singh",
    imageUrl: "https://github.com/identicons/user8.png",
  },
];

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-linear-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900 px-6 py-12">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-wide">
            IITK Nexus | Team Compass
          </h1>
          <p className="text-muted-foreground">FAQs, Team, and Stats.</p>
        </header>

        <section className="rounded-2xl bg-card/80 backdrop-blur-xl border shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">FAQs</h2>
            <p className="text-muted-foreground">
              Quick answers to common questions about the search app.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger>
                How does custom profile picture logic work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                1. You can upload new profile pictures from the profile page.
                <br></br>
                2. By default the system fetches and sets the image named{" "}
                <span className="font-medium">dp.jpg</span> or
                <span className="font-medium"> dp.png</span> in your IITK
                webhome folder. (Visiting
                <span className="block mt-1 font-mono text-sm">
                  http://home.iitk.ac.in/~yourusername/dp
                </span>
                should display your picture.)
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2">
              <AccordionTrigger>
                I can’t see students’ pictures or access student data
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <li>
                  <span className="font-bold">LogIn:</span> Please Log In
                  before, to access the student search.
                </li>
                <li>
                  <span className="font-bold">Visibility:</span> You must make
                  your profile visible to view other profiles.
                </li>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3">
              <AccordionTrigger>Changes not reflecting.</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                1. If the app is not functioning as expected or recent updates
                are not visible, clearing the application cache usually resolves
                the issue.
                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-fit"
                    onClick={() => {
                      indexedDB.deleteDatabase("students");
                      window.location.reload();
                    }}
                  >
                    Clear App Cache
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This clears locally stored data for this website only and
                    reloads the page.
                  </p>
                </div>
                <br></br>
                2. If your image was successfully uploaded, but is not changed
                on the student search portal, please wait for some time as the
                network caches the images, it will auto update in some time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4">
              <AccordionTrigger>Credits</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Credit for Student Guide data (bacche, ammas and baapus) goes to
                the{" "}
                <a
                  href="https://www.iitk.ac.in/counsel/"
                  className="underline hover:no-underline"
                >
                  Center for Mental Health and Wellbeing, IIT Kanpur
                </a>
                .
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="rounded-2xl bg-card/80 backdrop-blur-xl border shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Team of 2025-26</h2>
            <p className="text-muted-foreground">
              We work together to build what we all love!
            </p>
          </div>

          <div className="grid grid-cols-1  md:grid-cols-2 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <Card
                key={member.rollNo}
                className="flex flex-row items-center text-center transition-shadow hover:shadow-lg overflow-hidden"
              >
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="h-full w-1/2 object-cover "
                />

                <CardHeader className="w-1/2">
                  <CardTitle className="text-2xl">{member.name}</CardTitle>
                  <CardDescription>Roll: {member.rollNo}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contribution Guide</CardTitle>
              <CardDescription>
                The basics to get started with Compass Search.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ul className="list-disc ml-6 space-y-2">
                <li>Clone the repository.</li>
                <li>Check out open issues, discuss with the community.</li>
                <li>Pick one, make changes, and open a PR!</li>
              </ul>
              <p>
                Repository:{" "}
                <a
                  className="underline hover:no-underline"
                  href="https://github.com/pclubiitk/compass"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/pclubiitk/compass
                </a>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Statistics
                <ComingSoon />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              We will be adding analytics, growth, and adoption stats soon!
            </CardContent>
          </Card>
        </section>

        <section className="text-center text-muted-foreground">
          You can contribute to this project on our GitHub repository.
          <br />
          Visit{" "}
          <a
            className="underline hover:no-underline"
            href="https://github.com/pclubiitk/compass"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/pclubiitk/compass
          </a>{" "}
          for more details.
        </section>
      </div>
    </div>
  );
}

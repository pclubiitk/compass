"use client";
import { Accordion } from "@/components/ui/accordion";
import { NoticeCard } from "./NoticeCard";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ShareButton } from "./ShareButton";

export function Accordions() {
  const [hashId, setHashId] = useState<string | null>(null);

  useEffect(() => {
    // Client-side only: Get initial hash
    const hash = window.location.hash.substring(1);
    console.log(hash);
    if (hash) setHashId(hash);
  }, []);
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full flex flex-col gap-2 p-2"
      onValueChange={(id) => {
        if (id) {
          window.location.hash = id; // Add hash when opening
          setHashId(id);
        } else {
          // Remove hash when closing
          window.history.replaceState(null, "", window.location.pathname);
          setHashId("");
        }
      }}
      value={hashId || ""}
    >
      <NoticeCard
        id="antaragni"
        cardTitle="Antaragni 2025 - Arijit Singh Live!"
        cardDescription="IIT Kanpur proudly presents Antaragni, its annual cultural fest, from 15th-18th October 2025"
        noticePreview="Superstar Arijit Singh performing live!"
        discription={
          <div className="space-y-2">
            <p>
              Antaragni, IIT Kanpur&apos;s premier cultural festival, returns
              with its biggest edition yet!
            </p>
            <Image
              src="/Antaragni.svg"
              alt="Antaragni 2025 Poster"
              width={300}
              height={400}
            />

            <p className="font-bold text-lg">
              🌟 Special Attraction: Arijit Singh Live Concert on 17th October!
              🌟
            </p>

            <p>Other highlights include:</p>
            <ul className="list-disc pl-5">
              <li>Star nights with top artists</li>
              <li>Competitions in dance, music, drama and more</li>
              <li>Celebrity talks and workshops</li>
              <li>Food stalls and cultural exhibitions</li>
            </ul>

            <p>Venue: Open Air Theatre (OAT), IIT Kanpur</p>
            <p>
              Registrations open soon at{" "}
              <a href="https://antaragni.in" className="text-blue-500">
                antaragni.in
              </a>
            </p>
            <p className="text-red-500">
              Limited passes available for Arijit Singh&apos;s performance!
            </p>
            <ShareButton />
          </div>
        }
      />

      <NoticeCard
        id="sherlock"
        cardTitle="Cycle Security Alert"
        cardDescription="Increased bicycle thefts reported across campus"
        noticePreview="Renowned detective investigating - security measures enforced"
        discription={
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">
              🚲 Campus Cycle Theft Investigation
            </h4>
            <div className="flex flex-col items-center">
              <Image
                src="/sherlock.svg"
                alt="Sherlock Holmes with magnifying glass"
                width={120}
                height={120}
                className="mb-3"
              />
              <p className="text-center text-muted-foreground">
                Detective Sherlock Holmes leading investigation
              </p>
            </div>
            <div className="space-y-2">
              <p>
                Following 15 reported bicycle thefts this month, the
                administration has engaged consulting detective Sherlock Holmes
                to solve the case.
              </p>

              <div className="bg-blue-800 p-3 rounded-md border border-blue-100">
                <h5 className="font-medium mb-1">
                  🔒 Immediate Safety Measures:
                </h5>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Mandatory double-locking system (U-lock + chain)</li>
                  <li>New security cameras being installed</li>
                  <li>Night patrols increased by 40%</li>
                </ul>
              </div>

              <p className="mt-2">Until the investigation concludes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Register your bicycle at security office (compulsory)</li>
                <li>Use only designated parking zones</li>
                <li>Report suspicious activity immediately</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Holmes&apos; preliminary findings suggest an organized theft
                ring targeting premium bicycles.
              </p>
            </div>
            <ShareButton />
          </div>
        }
      />

      <NoticeCard
        id="doraemon"
        cardTitle="Special Campus Visitor"
        cardDescription="Famous robotic cat from the future arrives on campus"
        noticePreview="Doraemon offering gadget demonstrations this week"
        discription={
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">
              🤖 Doraemon&apos;s Campus Visit
            </h4>
            <div className="flex flex-col items-center">
              <Image
                src="/doraemon.svg"
                alt="Doraemon the robotic cat"
                width={120}
                height={120}
                className="mb-3"
              />
              <p className="text-center text-muted-foreground">
                The 22nd century robotic cat
              </p>
            </div>
            <div className="space-y-2">
              <p>
                In an unprecedented event, the future robotic cat Doraemon has
                time-traveled to our campus for a week-long knowledge exchange
                program.
              </p>

              <div className="bg-green-800 p-3 rounded-md border border-green-100">
                <h5 className="font-medium mb-1">
                  📅 Special Events Schedule:
                </h5>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="font-medium">June 6:</span> Gadget
                    Exhibition (Main Quad)
                  </li>
                  <li>
                    <span className="font-medium">June 7:</span> Time Travel
                    Theory Workshop
                  </li>
                  <li>
                    <span className="font-medium">June 8:</span> Anywhere Door
                    Practical Demo
                  </li>
                </ul>
              </div>

              <p className="mt-2">Featured Activities:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Try the &apos;Take-copter&apos; for personal flight experience
                </li>
                <li>Learn future programming languages</li>
                <li>See 22nd century environmental solutions</li>
              </ul>

              <div className="bg-yellow-800 p-3 rounded-md border border-yellow-100 mt-2">
                <p className="text-sm">
                  <span className="font-medium">Note:</span> All activities
                  supervised by Nobita&apos;s great-great-grandson. Do not
                  attempt to alter past/future events.
                </p>
              </div>
            </div>
            <ShareButton />
          </div>
        }
      />

      <NoticeCard
        id="unicorn"
        cardTitle="Magical Pasture Discovery"
        cardDescription="Rare unicorn spotted in campus gardens"
        noticePreview="Enchanted creature requires special handling"
        discription={
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">
              ✨ Unicorn in Botanical Gardens
            </h4>
            <div className="flex flex-col items-center">
              <Image
                src="/unicorn.svg"
                alt="Pure white unicorn with golden horn"
                width={120}
                height={120}
                className="mb-3"
              />
              <p className="text-center text-muted-foreground">
                Illustration of the observed unicorn
              </p>
            </div>
            <div className="space-y-2">
              <p>
                Yesterday at dawn, multiple students witnessed a magnificent
                silver-maned unicorn grazing near the rose bushes in North
                Garden.
              </p>

              <div className="bg-purple-800 p-3 rounded-md border border-purple-100">
                <h5 className="font-medium mb-1">🦄 Special Instructions:</h5>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Maintain minimum 10m distance at all times</li>
                  <li>No flash photography - unicorns are light-sensitive</li>
                  <li>Offer only rainbow-colored fruits if approached</li>
                </ul>
              </div>

              <p className="mt-2">Biology Department advises:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Magical creatures course now accepting volunteers</li>
                <li>Temporary garden closure during twilight hours</li>
                <li>Report any glowing hoofprints to ground staff</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Unicorns are known to purify water sources - drinking fountains
                may taste sweeter.
              </p>
            </div>
            <ShareButton />
          </div>
        }
      />

      <NoticeCard
        id="dragon"
        cardTitle="Dragon Nest Alert"
        cardDescription="Juvenile dragon observed near chemistry building"
        noticePreview="Fire safety protocols activated"
        discription={
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">
              🔥 Dragon Roost Established
            </h4>
            <div className="flex flex-col items-center">
              <Image
                src="/dragon.svg"
                alt="Small green dragon with smoke nostrils"
                width={120}
                height={120}
                className="mb-3"
              />
              <p className="text-center text-muted-foreground">
                Artist&apos;s rendition of the juvenile dragon
              </p>
            </div>
            <div className="space-y-2">
              <p>
                A young emerald-scaled dragon (approx 2m wingspan) has built a
                nest atop the Chemistry Department&apos;s smokestack.
              </p>

              <div className="bg-red-800 p-3 rounded-md border border-red-100">
                <h5 className="font-medium mb-1">🚨 Emergency Measures:</h5>
                <ul className="list-disc pl-5 space-y-1">
                  <li>All Bunsen burners restricted to low flame</li>
                  <li>No volatile chemicals outside after dark</li>
                  <li>Mandatory fire extinguisher checks</li>
                </ul>
              </div>

              <p className="mt-2">Zoology Department notes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>This appears to be a curious juvenile, not aggressive</li>
                <li>Attempting non-invasive relocation after exams</li>
                <li>Collecting shed scales for research (50% grade bonus)</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Dragon&apos;s presence has reduced pigeon population by 72% -
                mixed reactions from staff.
              </p>
            </div>
            <ShareButton />
          </div>
        }
      />

      <NoticeCard
        id="pheonix"
        cardTitle="OAT Closure Announcement"
        cardDescription="Open Air Theater temporarily closed for magical creature study"
        noticePreview="Rare phoenix sighting at OAT - Institute intervention required"
        discription={
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">
              🔍 Extraordinary Wildlife Sighting
            </h4>
            <div className="flex flex-col items-center">
              <Image
                src="/pheonix.svg"
                alt="Illustration of phoenix bird"
                width={120}
                height={120}
                className="mb-3"
              />
              <p className="text-center text-muted-foreground">
                Artist&apos;s rendering of the observed phoenix
              </p>
            </div>
            <div className="space-y-2">
              <p>
                A fully-grown phoenix has been confirmed nesting in the Open Air
                Theater (OAT) since yesterday evening. Multiple faculty members
                have verified the sighting.
              </p>

              <div className="bg-amber-800 p-3 rounded-md border border-amber-100">
                <h5 className="font-medium mb-1">⚠️ Immediate Actions:</h5>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    OAT will be closed from{" "}
                    <span className="font-medium">June 2-5, 2025</span>
                  </li>
                  <li>All scheduled events relocated to SAC Auditorium</li>
                  <li>Magical Zoology team arriving tomorrow for study</li>
                </ul>
              </div>

              <p className="mt-2">
                The Institute for Mythical Creatures will be:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Documenting this rare magical manifestation</li>
                <li>Ensuring the phoenix&apos;s safe migration</li>
                <li>Studying potential effects on campus environment</li>
              </ul>
            </div>
            <ShareButton />
          </div>
        }
      />
    </Accordion>
  );
}

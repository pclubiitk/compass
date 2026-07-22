"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Shield, Lock, AlertTriangle, Eye, Server } from "lucide-react";

export default function PuppyLoveTnCPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-rose-950/10 dark:to-purple-950/10 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <div className="flex justify-center">
            <Image
              src="/icons/puppyLoveLogo.png"
              alt="PuppyLove"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-wide text-rose-600">
            PuppyLove Terms & Conditions
          </h1>
          <p className="text-muted-foreground">
            Valentine&apos;s 2026 | Please read carefully before registering
          </p>
        </header>

        <br></br>
        <div className="text-center">
          <Link href="/" className="text-rose-600 hover:underline font-medium">
            &larr; Back to Student Search
          </Link>
        </div>

        <section className="rounded-2xl bg-card/80 backdrop-blur-xl border shadow-xl p-8 space-y-6">
          {/* Introduction */}
          <div>
            <p className="text-muted-foreground">
              PuppyLove is an anonymous matching platform designed to connect
              students during Valentine&apos;s season. By registering, you agree
              to abide by these terms and conditions. These terms are designed
              to ensure a safe and enjoyable experience for all participants.
            </p>
          </div>

          <hr className="border-rose-200 dark:border-rose-800/30" />

          {/* 1. Acceptance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-rose-600">
                1. Acceptance of Terms
              </h3>
            </div>
            <p className="text-muted-foreground ml-7">
              By creating an account on PuppyLove, you acknowledge that you have
              read, understood, and agree to be bound by these Terms &
              Conditions. If you do not agree to these terms, please do not
              register or use the service.
            </p>
          </div>

          <hr className="border-rose-200 dark:border-rose-800/30" />

          {/* 2. Anonymity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-rose-600">
                2. Anonymity & Privacy
              </h3>
            </div>
            <div className="ml-7 space-y-2 text-muted-foreground">
              <p>
                We strive to maintain <strong>100% anonymity</strong> for all
                participants. Your selections (&quot;hearts&quot;) are encrypted
                and cannot be viewed by anyone, including the development team
                and system administrators.
              </p>
              <p>
                <strong>However, please note:</strong> While we implement the
                best security practices, no system can guarantee absolute
                anonymity in all circumstances. In rare edge cases (such as
                server breaches, legal requirements, or unforeseen technical
                issues), there is a theoretical possibility that anonymity could
                be compromised.
              </p>
              <p>
                By using this service, you acknowledge and accept this inherent
                limitation of any digital system.
              </p>
            </div>
          </div>

          <hr className="border-rose-200 dark:border-rose-800/30" />

          {/* 3. Encryption */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-rose-600">
                3. Data Encryption
              </h3>
            </div>
            <div className="ml-7 space-y-2 text-muted-foreground">
              <p>
                All heart selections are <strong>fully encrypted</strong> using
                RSA encryption. Your private key is generated locally in your
                browser and encrypted with your password before being stored.
              </p>
              <p>
                <strong>
                  Your hearts are encrypted with the recipient&apos;s public key
                </strong>
                , meaning only they can decrypt them. Even the server
                administrators cannot see who you have selected.
              </p>
              <p>
                Matches are computed by checking encrypted intersections,
                ensuring privacy is maintained throughout the process.
              </p>
            </div>
          </div>

          <hr className="border-rose-200 dark:border-rose-800/30" />

          {/* 4. Liability */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-rose-600">
                4. Limitation of Liability
              </h3>
            </div>
            <div className="ml-7 space-y-2 text-muted-foreground">
              <p>
                <strong>
                  The Programming Club, IIT Kanpur, and the development team are
                  not responsible for:
                </strong>
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Any matches or lack thereof resulting from the service</li>
                <li>
                  Any emotional distress, disappointment, or outcomes arising
                  from participation
                </li>
                <li>
                  Any actions taken by matched individuals after the event
                </li>
                <li>Any misuse of the platform by other users</li>
                <li>
                  Any data breaches or security incidents beyond our reasonable
                  control
                </li>
                <li>Any technical failures, bugs, or service interruptions</li>
              </ul>
              <p className="mt-2">
                By participating, you agree to hold the organizers harmless from
                any claims, damages, or liabilities arising from your use of
                PuppyLove.
              </p>
            </div>
          </div>

          <hr className="border-rose-200 dark:border-rose-800/30" />

          {/* 5. User Conduct */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-rose-600">
                5. User Conduct
              </h3>
            </div>
            <div className="ml-7 space-y-2 text-muted-foreground">
              <p>By using PuppyLove, you agree to:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Use the service only for its intended purpose</li>
                <li>Not attempt to exploit, hack, or compromise the system</li>
                <li>Respect the privacy and anonymity of other users</li>
                <li>Not harass, stalk, or inappropriately contact any user</li>
                <li>Keep your password secure and not share your account</li>
              </ul>
              <p className="mt-2">
                Violation of these terms may result in removal from the platform
                and disciplinary action as per institute policies.
              </p>
            </div>
          </div>

          <hr className="border-rose-200 dark:border-rose-800/30" />

          {/* 6. Data Retention */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-rose-600">
                6. Data Retention & Deletion
              </h3>
            </div>
            <div className="ml-7 space-y-2 text-muted-foreground">
              <p>
                All encrypted heart data and match results will be retained only
                for the duration of the event. After the event concludes, all
                heart selections and related encrypted data will be deleted from
                our servers.
              </p>
            </div>
          </div>

          <hr className="border-rose-200 dark:border-rose-800/30" />

          {/* 7. Eligibility */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-rose-600">
                7. Eligibility
              </h3>
            </div>
            <p className="text-muted-foreground ml-7">
              This service is exclusively available to current students of the
              Indian Institute of Technology Kanpur. By registering, you confirm
              that you are an authenticated IITK student.
            </p>
          </div>

          <hr className="border-rose-200 dark:border-rose-800/30" />

          {/* 8. Changes to Terms */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h3 className="text-xl font-semibold text-rose-600">
                8. Changes to Terms
              </h3>
            </div>
            <p className="text-muted-foreground ml-7">
              We reserve the right to modify these terms at any time. Continued
              use of the service after changes constitutes acceptance of the
              revised terms.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl bg-card/80 backdrop-blur-xl border shadow-xl p-6 text-center">
          <p className="text-muted-foreground">
            For any concerns or queries, contact the Programming Club at{" "}
            <a
              href="mailto:pclubiitk@gmail.com"
              className="text-rose-600 hover:underline font-semibold"
            >
              pclubiitk@gmail.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 2026
          </p>
        </section>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-rose-600 hover:underline font-medium">
            &larr; Back to Student Search
          </Link>
        </div>
      </div>
    </div>
  );
}

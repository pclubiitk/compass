"use client";

import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen px-6 py-12 mx-auto">
      <div className="max-w-4xl md:ml-50">
        <h1 className="text-3xl font-bold">Data handling & Privacy Policy</h1>
        <h2>followed by Programming Club, IIT Kanpur</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 mb-8">
          Last Updated: 20 October 2025
        </p>
        <p className="mb-1">
          {/* TODO: Better parse it */}
          Welcome to IITK Nexus : An ecosystem of multiple applications to help
          IIT Kanpur campus community to be better connected with all the
          activities going on in the campus. It comprises of multiple
          applications namely:
        </p>
        <ol className="mb-2 list-disc ml-5">
          <li>
            <span className="font-bold">Compass:</span> A navigation
            application, to help you explore the unexplored.
          </li>
          <li>
            <span className="font-bold">Auth:</span> A Centralized
            authentication service you provide you access with just single sign
            up.
          </li>
          <li>
            <span className="font-bold">Notice Board:</span> Be updated with
            most recent updates about events, sessions, workshops via the
            noticeboard.
          </li>
          <li>
            <span className="font-bold">Student Search:</span> Want to find
            seniors, batchmates, lab partner, search across all the batches,
            branches.
          </li>
        </ol>
        <p>
          To abide by the rules set by{" "}
          <span className="font-bold">
            {" "}
            Indian Government, and IIT Kanpur Administration <span /> below is
            the document describing our data handling and privacy policy.
            <br />
            Please read it carefully before proceeding with registration or use
            of our services. By accessing or using this application,
          </span>{" "}
          you agree to be bound by these Terms and Conditions.
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h3>
        <p className="mb-6">
          By registering or using this application, you acknowledge that you
          have read, understood, and agree to comply with these Terms and
          Conditions. If you do not agree with any part of these terms, you must
          not access or use the application.
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">2. Eligibility</h3>
        <p className="mb-6">
          This Website is intended exclusively for students of the Indian
          Institute of Technology Kanpur (“IIT Kanpur”). By registering, you
          confirm that you are a current or incoming student authorized to use
          institute resources.
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">
          3. Data Collection and Consent
        </h3>
        <p className="mb-6">
          By creating an account and using our platform, you consent to the
          collection, processing, and use of your personal data in accordance
          with our{" "}
        </p>{" "}
        <br />
        <h4>Privacy Policy</h4>
        {/* TODO: Enhance, update and get and idea from */}
        {/* https://github.com/Ketan-Agarwal/freshers-intro/blob/staging/frontend/src/app/privacy/page.tsx */}
        {/* Add more details: https://docs.google.com/document/d/15ZXcX7RvSF1VzcFcnuMc2KmSfXgVFAhhDq4LicYeVcg/edit?usp=sharing */}
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">
          4. Flow of Data and Verification Process
        </h3>
        <p className="whitespace-pre-line mb-2">
          In order to maintain the authenticity and integrity of user profiles,
          the following data flow process is followed:
        </p>
        <ol className="list-disc ml-5 mb-2">
          <li>
            We request SG data directly from the Institute Councelling
            Service(ICS) to validate and encopourate it into the family tree.
          </li>
          <li>
            The obtained profile data is cross-verified with the Computer Centre
            (CC) to ensure its accuracy and prevent impersonation.
          </li>
          <li>
            The verification process is handled securely, and no sensitive
            information is exposed to unauthorized parties.
          </li>
        </ol>
        <p>
          By proceeding with registration, you provide explicit consent for us
          to access, verify, and process this data for legitimate institutional
          purposes related to your participation on Campus Compass.
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">5. User Responsibilities</h3>
        <p className="mb-6">
          You agree to provide accurate and truthful information during
          registration and profile creation. You must not impersonate any
          individual or provide misleading academic or personal details. We
          reserve the right to suspend or remove any profile found to contain
          false information.
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">6. Intellectual Property</h3>
        <p className="mb-6">
          All content, map data, design elements, and related materials
          available on this Website and application are the intellectual
          property of the respective contributors and the Programming Club, IIT
          Kanpur. Institutional landmarks, building names, and campus boundaries
          are derived from publicly available IIT Kanpur resources and are used
          solely for educational and navigational purposes.
          <br />
          You may not copy, redistribute, or modify the map data, images, or any
          kind of asset without prior written consent from the Programming Club,
          IIT Kanpur.
          <br />
          We believe in open source culture and, will surely reply to your
          request regarding such matters.
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">
          7. Limitation of Liability
        </h3>
        <p className="mb-6">
          We strive to provide accurate and secure services but do not guarantee
          that the Website will be error-free or uninterrupted. Under no
          circumstances shall the Programming Club or IIT Kanpur be liable for
          any damages arising from the use or inability to use this Website.
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">8. Amendments</h3>
        <p className="mb-6">
          We may revise these Terms and Conditions from time to time to reflect
          changes in our operations or legal requirements. Updated versions will
          be posted on this page with a new “Last Updated” date.
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h3 className="text-xl font-semibold mb-2">9. Contact Information</h3>
        <p className="whitespace-pre-line mb-2">
          For any questions, clarifications, or grievances regarding these
          Terms, please write to:
          <a
            href="mailto:pclubiitk@gmail.com"
            className="text-blue-600 dark:text-blue-400"
          >
            {" "}
            pclubiitk@gmail.com
          </a>
        </p>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
        <h5>
          I have read and agree with all the terms and conditions described
          above and would like to proceed to{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            {" "}
            account creation
          </Link>
        </h5>
      </div>
    </div>
  );
}

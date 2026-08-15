"use client";

import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen px-6 py-12 mx-auto">
      <div className="max-w-4xl md:ml-50">
        <h1 className="text-3xl font-bold">Data handling & Privacy Policy</h1>
        <h2 className="text-lg mt-1">followed by Programming Club, IIT Kanpur</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 mb-8">
          Last Updated: August 15, 2026
        </p>
        
        <p className="mb-2">
          Welcome to IITK Nexus: An ecosystem of multiple applications to help
          the IIT Kanpur campus community be better connected with all the
          activities going on in the campus. It comprises multiple
          applications, namely:
        </p>
        
        <ol className="mb-4 space-y-2 list-disc ml-5">
          <li>
            <span className="font-bold">Compass:</span> A navigation
            application to help you explore the unexplored.
          </li>
          <li>
            <span className="font-bold">Auth:</span> A centralized
            authentication service to provide you access with just a single sign-up.
          </li>
          <li>
            <span className="font-bold">Notice Board:</span> Be updated with
            the most recent updates about events, sessions, and workshops.
          </li>
          <li>
            <span className="font-bold">Student Search:</span> Find
            seniors, batchmates, lab partners, and search across all batches and branches.
          </li>
        </ol>

        <p className="mb-2">
          To abide by the rules set by the Indian Government (including the{" "}
          <strong className="font-bold">Digital Personal Data Protection Act, 2023</strong>), 
          below is the document describing our data handling and privacy policy.
        </p>
        <p className="mb-6">
          <strong className="font-bold">Please read it carefully before proceeding with registration or use
          of our services. By accessing or using this application, you agree to be bound by these Terms and Conditions.</strong>
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h3>
        <p className="mb-6">
          By registering or using this application, you acknowledge that you
          have read, understood, and agree to comply with these Terms and
          Conditions. If you do not agree with any part of these terms, you must
          not access or use the application.
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">2. Eligibility</h3>
        <p className="mb-6">
          This service is intended exclusively for <strong className="font-bold">authorised members of the IIT Kanpur community</strong>. By registering, you confirm that you are authorised to use institute resources.
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">3. Data Collection and Consent</h3>
        <p className="mb-3">
          By creating an account and using our platform, you consent to the
          collection, processing, and use of your personal data. Depending on the features you use, we may collect:
        </p>
        <ul className="list-disc ml-5 mb-4 space-y-2">
          <li>
            <strong className="font-bold">Account Data:</strong> Your IIT Kanpur email address, hashed password and verification status.
          </li>
          <li>
            <strong className="font-bold">Profile Data:</strong> Name, roll number, course, department, gender, hall, room number, hometown, profile photograph, and visibility preference.
          </li>
          <li>
            <strong className="font-bold">Content and Activity:</strong> Locations, photographs, reviews, notices, moderation reports, and other material you choose to submit. (You are requested not to submit personal data that a feature does not ask for, particularly in free-text fields).
          </li>
          <li>
            <strong className="font-bold">Technical Data:</strong> Session cookies, request/error logs, device/browser information, and IP addresses, along with Google reCAPTCHA data used to prevent automated abuse.
          </li>
        </ul>
        <p className="mb-6">
          <strong className="font-bold">While processing relies on your consent, you may withdraw it at any time.</strong>
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">4. Flow of Data and Verification Process</h3>
        <p className="mb-3">
          In order to maintain the authenticity and integrity of user profiles,
          the following data flow process is followed:
        </p>
        <ol className="list-disc ml-5 mb-4 space-y-2">
          <li>
            We request SG data directly from the Center for Mental Health and Wellbeing Team (CMHW) to validate and incorporate it into the family tree.
          </li>
          <li>
            The obtained profile data is cross-verified with the Computer Centre (CC) to ensure its accuracy and prevent impersonation.
          </li>
          <li>
            The verification process is handled securely, and no sensitive information is exposed to unauthorized parties.
          </li>
          <li>
            We will collect your profile photo from the OA portal which can be removed or changed by you, after login.
          </li>
        </ol>
        <p className="mb-6">
          By proceeding with registration, you provide explicit consent for us to access, verify, and process this data for legitimate institutional purposes related to your participation on Campus Compass.
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">5. Sharing, Visibility, and Security</h3>
        <p className="mb-3">
          Profile information is excluded from Student Search until directory visibility is enabled by you. Information you actively publish (notices, reviews, etc.) may be visible to other users.
        </p>
        <ul className="list-disc ml-5 mb-6 space-y-2">
          <li>
            <strong className="font-bold">Access:</strong> Authorised Programming Club administrators and moderators may access data only when necessary to operate, support, secure, or moderate the service.
          </li>
          <li>
            <strong className="font-bold">Security & Retention:</strong> We use strict access controls, password hashing, and secure session cookies. Data is retained while your account is active and <strong className="font-bold">deleted at periodic intervals when your account is no longer active.</strong>
          </li>
          <li>
            <strong className="font-bold">Disclosure:</strong> We do not sell personal data or use it for targeted advertising. Data is only disclosed when required by applicable law, valid legal process, or authorised institutional requirements.
          </li>
        </ul>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">6. Your Choices and Rights</h3>
        <p className="mb-3">
          In accordance with the Digital Personal Data Protection Act, 2023, <strong className="font-bold">you retain full rights over your data</strong>. You may:
        </p>
        <ul className="list-disc ml-5 mb-6 space-y-2">
          <li>Review and correct editable profile details.</li>
          <li>Replace your profile photograph or change directory visibility.</li>
          <li>Request information about your personal data, or request correction, erasure, account deletion, or withdrawal of consent.</li>
          <li>Raise a grievance regarding how your data is handled.</li>
        </ul>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">7. User Responsibilities</h3>
        <p className="mb-6">
          You agree to provide accurate and truthful information during registration. You must not impersonate another person, misuse the service, or upload content you lack permission to share. We may restrict or suspend access to address false information, abusive content, or enforce these terms.
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">8. Intellectual Property</h3>
        <p className="mb-6">
          All content, map data, design elements, and related materials available on this application are the intellectual property of the respective contributors and the Programming Club, IIT Kanpur. Institutional landmarks and campus boundaries are derived from publicly available resources and used solely for educational and navigational purposes. You may not copy, redistribute, or modify the map data or assets without prior written consent. We believe in open-source culture and will promptly reply to requests regarding such matters.
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">9. Limitation of Liability</h3>
        <p className="mb-6">
          We strive to provide accurate and secure services but do not guarantee that the application will be error-free or uninterrupted. Content and campus information may occasionally contain errors. Please verify important navigation, event, safety, and academic information through official IIT Kanpur sources. <strong className="font-bold">Under no circumstances shall the Programming Club or IIT Kanpur be liable for any damages arising from the use or inability to use this service.</strong>
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">10. Amendments</h3>
        <p className="mb-6">
          We may revise these terms and our privacy practices to reflect changes in our operations or legal obligations. Updated versions will be posted on this page with a new “Last Updated” date. Material changes may also be communicated directly through the service.
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h3 className="text-xl font-semibold mb-3">11. Contact Information and Grievances</h3>
        <p className="whitespace-pre-line mb-8">
         For any questions, clarifications, or grievances regarding these Terms, please write to: 
          <a
            href="mailto:pclubiitk@gmail.com"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            pclubiitk@gmail.com
          </a>
        </p>

        <hr className="my-6 border-gray-300 dark:border-gray-700" />
        
        <h5 className="text-lg font-medium">
          I have read and agree with all the terms and conditions described
          above and would like to proceed to{" "}
          <Link href="/signup" className="text-blue-600 hover:underline font-semibold">
            account creation
          </Link>
          .
        </h5>
      </div>
    </div>
  );
}
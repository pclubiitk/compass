'use client';

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white px-6 py-12 mx-auto">
      <div className="max-w-4xl md:ml-50">
        <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Last Updated: 20 October 2025</p>

        <p className="mb-6">
          Welcome to Campus Compass : A navigation application for IITK campus community.
          By accessing or using this application, you agree to be bound by these Terms and Conditions.
          Please read them carefully before proceeding with registration or use of our services.
        </p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
        <p className="mb-6">
          By registering or using this application, you acknowledge that you have read, understood, and agree to comply with these Terms and Conditions.
          If you do not agree with any part of these terms, you must not access or use the application.
        </p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">2. Eligibility</h2>
        <p className="mb-6">
          This Website is intended exclusively for students of the Indian Institute of Technology Kanpur (“IIT Kanpur”).
          By registering, you confirm that you are a current or incoming student authorized to use institute resources.
        </p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">3. Data Collection and Consent</h2>
        <p className="mb-6">
          By creating an account and using our platform, you consent to the collection, processing, and use of your personal data in accordance with our{" "}
          <a href="/privacy-policy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>.
        </p>

        <p className="mb-6">
          As part of your registration and verification, we may request access to your basic academic information (such as name, roll number, and branch) from official IIT Kanpur sources(Computer Centre).
        </p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">4. Flow of Data and Verification Process</h2>
        <p className="whitespace-pre-line mb-6">
          In order to maintain the authenticity and integrity of user profiles, the following data flow process is followed:
          <br/><br/>
          • We request certain academic details (such as SG data) directly from the Institute Councelling Service(ICS).{"\n"}
          • This data is used solely for verification and onboarding purposes and is never shared publicly without consent.{"\n"}
          • The obtained data is cross-verified with the Computer Centre (CC) to ensure its accuracy and prevent impersonation.{"\n"}
          • The verification process is handled securely, and no sensitive information is exposed to unauthorized parties.
          <br/><br/>
          By proceeding with registration, you provide explicit consent for us to access, verify, and process this data for legitimate institutional purposes related to your participation on Campus Compass.
        </p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">5. User Responsibilities</h2>
        <p className="mb-6">
          You agree to provide accurate and truthful information during registration and profile creation.
          You must not impersonate any individual or provide misleading academic or personal details.
          We reserve the right to suspend or remove any profile found to contain false information.
        </p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">6. Intellectual Property</h2>
<p className="mb-6">
  All content, map data, design elements, and related materials available on this Website and application
  are the intellectual property of the respective contributors and the Programming Club, IIT Kanpur.
  Institutional landmarks, building names, and campus boundaries are derived from publicly available IIT Kanpur resources
  and are used solely for educational and navigational purposes.
  <br /><br />
  You may not copy, redistribute, or modify the map data, application design, or underlying source code
  without prior written consent from the Programming Club, IIT Kanpur.
</p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">7. Limitation of Liability</h2>
        <p className="mb-6">
          We strive to provide accurate and secure services but do not guarantee that the Website will be error-free or uninterrupted.
          Under no circumstances shall the Programming Club or IIT Kanpur be liable for any damages arising from the use or inability to use this Website.
        </p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">8. Amendments</h2>
        <p className="mb-6">
          We may revise these Terms and Conditions from time to time to reflect changes in our operations or legal requirements.
          Updated versions will be posted on this page with a new “Last Updated” date.
        </p>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-semibold mb-2">9. Contact Information</h2>
        <p className="whitespace-pre-line mb-2">
          For any questions, clarifications, or grievances regarding these Terms, please contact:
        </p>
        Email: <span className="text-blue-600 dark:text-blue-400">pclubiitk@gmail.com</span>
      </div>
    </main>
  );
}

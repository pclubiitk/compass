"use client";

import { useEffect, useState } from "react";
import { SignupStepper } from "@/components/signup/SignupStepper";
import { Step1Register } from "@/components/signup/Step1Register";
import { Step2Verify } from "@/components/signup/Step2Verify";
import { Step3Profile } from "@/components/signup/Step3Profile";
import { useSearchParams } from "next/navigation";

// Define the steps for the stepper component
const steps = [
  { title: "Register", description: "your account" },
  { title: "Verify", description: "your email" },
  { title: "Complete", description: "your profile" },
];

export default function SignupPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userID: "",
  });

  // Hook to read URL query parameters
  const searchParams = useSearchParams();

  // This effect runs once on page load to handle direct links from email
  useEffect(() => {
    const token = searchParams.get("token");
    const userID = searchParams.get("userID");

    // If both token and userID are in the URL, jump to Step 2
    if (token && userID) {
      setFormData((prev) => ({ ...prev, userID: userID }));
      setActiveStep(1);
    }
    // The empty dependency array [] ensures this runs only once on mount
  }, []);

  const handleRegisterSuccess = (data: { userID: string }) => {
    setFormData((prev) => ({ ...prev, userID: data.userID }));
    setActiveStep(1);
  };

  const handleVerifySuccess = () => {
    setActiveStep(2);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <Step1Register onSuccess={handleRegisterSuccess} />;
      case 1:
        return (
          <Step2Verify
            userID={formData.userID}
            onSuccess={handleVerifySuccess}
          />
        );
      case 2:
        return <Step3Profile />;
      default:
        return null;
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-r 
  from-blue-100 to-teal-100 
  dark:from-slate-800 dark:to-slate-900"
    >
      <div className="w-full max-w-2xl mb-8">
        <SignupStepper activeStep={activeStep} steps={steps} />
      </div>
      {renderStepContent()}
    </div>
  );
}

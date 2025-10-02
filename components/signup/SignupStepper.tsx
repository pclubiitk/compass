"use client";

import { cn } from "@/lib/utils";

interface SignupStepperProps {
  activeStep: number;
  steps: { title: string; description: string }[];
}

export function SignupStepper({ activeStep, steps }: SignupStepperProps) {
  return (
    <nav className="flex items-center justify-center py-4" aria-label="Progress">
      <ol className="flex items-center space-x-5">
        {steps.map((step, index) => {
          const isCompleted = activeStep > index;
          const isCurrent = activeStep === index;

          return (
            <li key={step.title}>
              <div className="relative flex items-center">
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-4 -ml-px mt-0.5 h-0.5 w-12 bg-gray-300" />
                )}
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                  {isCompleted ? (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className={cn(
                      "h-8 w-8 rounded-full border-2 flex items-center justify-center",
                      isCurrent ? "border-blue-600 bg-white" : "border-gray-300 bg-gray-100"
                    )}>
                      <span className={cn(
                        "text-sm font-medium",
                        isCurrent ? "text-blue-600" : "text-gray-500"
                      )}>
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-col">
                  <span className="text-sm font-medium">{step.title}</span>
                  <span className="text-xs text-gray-500">{step.description}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
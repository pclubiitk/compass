"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function PuppyLoveTncPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-2">
                        <Image 
                            src="/icons/puppyLoveLogo.png" 
                            alt="Puppy Love"
                            width={64}
                            height={64}
                            className="rounded-2xl"
                        />
                    </CardTitle>
                    <CardTitle className="text-2xl text-center">Puppy Love Terms & Conditions</CardTitle>
                    <CardDescription className="text-center">Please read carefully before registering</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">1. Privacy & Encryption</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your personal data is encrypted end-to-end using industry-standard RSA encryption. We do not store, sell, or share your information with third parties. Your identity remains anonymous until you choose to reveal it to a match.
                        </p>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div>
                        <h3 className="text-lg font-semibold mb-3">2. Anonymous Matching</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            All matches are kept confidential and encrypted. Identities are revealed only upon mutual consent. You have full control over your profile visibility and can choose to remain completely anonymous.
                        </p>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div>
                        <h3 className="text-lg font-semibold mb-3">3. Respectful Behavior & Code of Conduct</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Users agree to treat others with respect and courtesy. Harassment, abuse, hate speech, or inappropriate behavior will result in account suspension or permanent deletion. We take community safety seriously.
                        </p>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div>
                        <h3 className="text-lg font-semibold mb-3">4. Age Requirement</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            You must be at least 18 years old to use this service. By registering, you confirm that you are of legal age and authorized to use this platform as per your jurisdiction.
                        </p>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div>
                        <h3 className="text-lg font-semibold mb-3">5. No Liability</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The platform is provided "as-is" without warranty. We are not responsible for any personal decisions made based on matches, interactions, or information shared on this platform. Users are solely responsible for their actions and decisions.
                        </p>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div>
                        <h3 className="text-lg font-semibold mb-3">6. Data Deletion & Privacy Rights</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            You have the right to request complete deletion of your account and all associated data at any time. Upon password reset, all Puppy Love profile data will be cleared and you will need to re-register.
                        </p>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div>
                        <h3 className="text-lg font-semibold mb-3">7. Service Modification</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We reserve the right to modify or discontinue this service at any time. These Terms and Conditions may be updated periodically, and your continued use of the service constitutes acceptance of any changes.
                        </p>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <Button 
                            onClick={() => router.back()}
                            variant="outline"
                            className="flex-1"
                        >
                            Back
                        </Button>
                        <Button 
                            onClick={() => router.back()}
                            className="flex-1"
                        >
                            I Agree & Continue
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

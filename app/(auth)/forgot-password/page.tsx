"use client";

import { useTransition, useRef} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import ReCAPTCHA from "react-google-recaptcha";


const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }).refine((email) => email.endsWith("@iitk.ac.in"), {
        message: "Please enter a valid IITK email address.",
    }),
});

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition();

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const token = await recaptchaRef.current?.executeAsync();
      if (!token) {
        toast.error("Error in captcha validation");
        return;
      }

      startTransition(async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...values, token }),
          });

                    const data = await response.json();

          if (response.ok) {
            toast.success(data.message || "Reset link sent.");
          } else {
            toast.error(data.error || "Something went wrong.");
          }
        } catch {
          toast.error("Something went wrong.");
        } finally {
          recaptchaRef.current?.reset();
        }
      });
    } catch {
      toast.error("Captcha error.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-linear-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {/* Centered Logo & Club Name Section */}
          <CardTitle className="flex flex-col items-center gap-2">
            <a href="https://pclub.in" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Image
                  src="/pclub.png"
                  alt="Logo"
                  width={60}
                  height={60}
                  className="rounded-2xl"
                />
              </div>
            </a>
          </CardTitle>
          <CardDescription className="flex flex-col items-center gap-2">
            <p>Programming Club IIT Kanpur</p>
          </CardDescription>

          {/* Left-Aligned Page Title & Description */}
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to reset your password. Don&apos;t have an account?{" "}
            <Button
              variant="link"
              asChild
              className="p-0 h-auto underline-offset-4"
            >
              <a href="/signup">Sign up</a>
            </Button>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="@iitk.ac.in" 
                        {...field} 
                        type="email"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ReCAPTCHA sitekey={siteKey} ref={recaptchaRef} size="invisible" />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Verifying..." : "Send Reset Link"}
              </Button>

              {/* Divider with OR text */}
              <div className="relative -my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 dark:bg-slate-950 dark:text-gray-400">
                    or
                  </span>
                </div>
              </div>

              {/* Alternative action */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/login"}
              >
                Back to Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

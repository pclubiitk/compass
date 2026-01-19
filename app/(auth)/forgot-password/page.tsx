"use client";

import { useTransition } from "react";
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
import axios from "axios";
import Link from "next/link";
import Image from "next/image";


const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
});

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                const response = await axios.post("/api/auth/forgot-password", values);
                toast.success(response.data.message || "Reset link sent if email exists.");
            } catch (error: any) {
                toast.error("Something went wrong. Please try again.");
                console.error(error);
            }
        });
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-linear-to-r from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-900">
            <Card className="w-full max-w-md rounded-3xl shadow-2xl border-none">
                <CardHeader className="space-y-1.5 items-center pt-8">
                    <div className="flex size-12 items-center justify-center rounded-2xl mb-4 bg-primary/10">
                        <Image
                            src="/pclub.png"
                            alt="Programming Club Logo"
                            width={60}
                            height={60}
                            className="rounded-2xl"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">
                        Forgot Password
                    </CardTitle>
                    <CardDescription className="text-sm text-center px-4">
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="ml-1">Email address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="user@iitk.ac.in" {...field} className="rounded-xl h-12" />
                                        </FormControl>
                                        <FormMessage className="ml-1" />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full rounded-xl h-12 text-base font-medium" disabled={isPending}>
                                {isPending ? "Sending..." : "Send Reset Link"}
                            </Button>

                            <div className="text-sm text-center">
                                <Link href="/login" className="font-medium text-primary hover:text-primary/90 transition-colors">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );

}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { registerSchema, verifySchema, type RegisterInput, type VerifyInput } from "@/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="mt-1 text-xs text-destructive">{message}</p>;
}

export function RegisterForm() {
  const [step, setStep] = useState<"register" | "verify" | "done">("register");
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  // Registration form
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Verification form
  const verifyForm = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: "", code: "" },
  });

  async function handleRegister(data: RegisterInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setServerError(result.error?.message ?? "Registration failed.");
        return;
      }
      //setEmail(data.email);
      //verifyForm.setValue("email", data.email);
      //setStep("verify");
      if (result.data?.message?.includes("Dev mode")) {
  setStep("done");
  return;
}

setEmail(data.email);
verifyForm.setValue("email", data.email);
setStep("verify");
    } catch {
      setServerError("Network error. Please try again.");
    }
  }

  async function handleVerify(data: VerifyInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setServerError(result.error?.message ?? "Verification failed.");
        return;
      }
      setStep("done");
    } catch {
      setServerError("Network error. Please try again.");
    }
  }

  // Done state Account verified
  if (step === "done") {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-10 text-green-600" />
        <h2 className="text-lg font-semibold">Account created!</h2>
        <p className="text-sm text-muted-foreground">You can now sign in with your credentials.</p>
        <Link href="/login" className="inline-block text-sm text-primary hover:underline">Go to login</Link>
      </div>
    );
  }

  // Verify step
  if (step === "verify") {
    return (
      <form onSubmit={verifyForm.handleSubmit(handleVerify)} noValidate className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We sent a verification code to <strong>{email}</strong>. Enter it below.
        </p>
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Verification failed</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <input type="hidden" {...verifyForm.register("email")} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input id="code" placeholder="123456" maxLength={6} aria-invalid={!!verifyForm.formState.errors.code} {...verifyForm.register("code")} />
          <FieldError message={verifyForm.formState.errors.code?.message} />
        </div>
        <Button type="submit" disabled={verifyForm.formState.isSubmitting} className="w-full" size="lg">
          {verifyForm.formState.isSubmitting ? "Verifying…" : "Verify email"}
        </Button>
      </form>
    );
  }

  // Register step
  return (
    <form onSubmit={registerForm.handleSubmit(handleRegister)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Registration failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!registerForm.formState.errors.email} {...registerForm.register("email")} />
        <FieldError message={registerForm.formState.errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!registerForm.formState.errors.password} {...registerForm.register("password")} />
        <FieldError message={registerForm.formState.errors.password?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!registerForm.formState.errors.confirmPassword} {...registerForm.register("confirmPassword")} />
        <FieldError message={registerForm.formState.errors.confirmPassword?.message} />
      </div>
      <Button type="submit" disabled={registerForm.formState.isSubmitting} className="w-full" size="lg">
        {registerForm.formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

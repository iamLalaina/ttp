import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — TTP",
};

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your pets and adoption requests.
        </p>
      </div>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

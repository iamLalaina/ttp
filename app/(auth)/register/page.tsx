import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account — TTP",
};

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to start registering pets for adoption.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}

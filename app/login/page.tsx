"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  function handleLogin() {
    document.cookie = "auth-token=stub-token; path=/";
    router.push("/dashboard");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Login (temporary)
      </h1>

      <p className="mt-4">
        Auth will be implemented in the Cognito spec.
      </p>

      <button
        onClick={handleLogin}
        className="mt-6 rounded bg-black px-4 py-2 text-white"
      >
        Continue
      </button>
    </main>
  );
}
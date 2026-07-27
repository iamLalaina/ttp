"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  createAdoptionRequestSchema,
  type CreateAdoptionRequestSchemaInput,
} from "@/schemas/adoption.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiResponse } from "@/types/api.types";
import type { AdoptionRequestType } from "@/types/adoption.types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdoptionRequestFormProps {
  petId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Public adoption request form — Client Component.
 * No auth required. Shows success state after submission.
 */
export function AdoptionRequestForm({ petId }: AdoptionRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdoptionRequestSchemaInput>({
    resolver: zodResolver(createAdoptionRequestSchema),
    defaultValues: {
      petId,
      applicantName: "",
      applicantEmail: "",
      message: "",
    },
  });

  async function onSubmit(data: CreateAdoptionRequestSchemaInput) {
    setServerError(null);

    try {
      const res = await fetch("/api/adoption-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<AdoptionRequestType> = await res.json();

      if (!res.ok || result.error) {
        setServerError(result.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  }

  // Success state
  if (submitted) {
    return (
      <section className="rounded-lg border border-border bg-green-50 p-6 text-center dark:bg-green-900/10">
        <CheckCircle2 className="mx-auto size-10 text-green-600 dark:text-green-400" />
        <h3 className="mt-3 text-base font-semibold text-foreground">
          Request sent!
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your adoption request has been sent. The rescuer will contact you by
          email.
        </p>
      </section>
    );
  }

  // Form state
  return (
    <section aria-labelledby="adoption-form-heading" className="space-y-4">
      <h2
        id="adoption-form-heading"
        className="text-base font-semibold text-foreground"
      >
        Interested in adopting?
      </h2>
      <p className="text-sm text-muted-foreground">
        Fill out the form below and the rescuer will get back to you.
      </p>

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Request failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
        aria-label="Adoption request form"
      >
        {/* Hidden petId */}
        <input type="hidden" {...register("petId")} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="applicantName">Your name</Label>
          <Input
            id="applicantName"
            placeholder="e.g. María García"
            aria-invalid={!!errors.applicantName}
            {...register("applicantName")}
          />
          <FieldError message={errors.applicantName?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="applicantEmail">Your email</Label>
          <Input
            id="applicantEmail"
            type="email"
            placeholder="e.g. maria@example.com"
            aria-invalid={!!errors.applicantEmail}
            {...register("applicantEmail")}
          />
          <FieldError message={errors.applicantEmail?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="message">Why do you want to adopt this pet?</Label>
          <Textarea
            id="message"
            rows={4}
            placeholder="Tell the rescuer about yourself, your home, and why you'd be a great match."
            aria-invalid={!!errors.message}
            {...register("message")}
          />
          <FieldError message={errors.message?.message} />
        </div>

        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Sending…" : "Send adoption request"}
        </Button>
      </form>
    </section>
  );
}

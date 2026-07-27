"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { profileSchema, type ProfileSchemaInput } from "@/schemas/profile.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiResponse } from "@/types/api.types";
import type { RescuerProfileType } from "@/types/profile.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="mt-1 text-xs text-destructive">{message}</p>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RescuerProfileFormProps {
  profile: RescuerProfileType | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RescuerProfileForm({ profile }: RescuerProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSchemaInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName ?? "",
      bio: profile?.bio ?? "",
      city: profile?.city ?? "",
      state: profile?.state ?? "",
      phone: profile?.phone ?? "",
      websiteUrl: profile?.websiteUrl ?? "",
      imageUrl: profile?.imageUrl ?? "",
    },
  });

  async function onSubmit(data: ProfileSchemaInput) {
    setServerError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<RescuerProfileType> = await res.json();

      if (!res.ok || result.error) {
        setServerError(result.error?.message ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
      aria-label="Rescuer profile form"
    >
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="size-4 text-green-600" />
          <AlertTitle>Profile saved</AlertTitle>
          <AlertDescription>Your profile has been updated successfully.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" placeholder="e.g. María's Rescues" aria-invalid={!!errors.displayName} {...register("displayName")} />
        <FieldError message={errors.displayName?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio / description</Label>
        <Textarea id="bio" rows={4} placeholder="Tell potential adopters about yourself or your organization." aria-invalid={!!errors.bio} {...register("bio")} />
        <FieldError message={errors.bio?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" aria-invalid={!!errors.city} {...register("city")} />
          <FieldError message={errors.city?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">State / Province</Label>
          <Input id="state" aria-invalid={!!errors.state} {...register("state")} />
          <FieldError message={errors.state?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" type="tel" placeholder="e.g. +54 11 1234-5678" {...register("phone")} />
        <FieldError message={errors.phone?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="websiteUrl">Website or social link (optional)</Label>
        <Input id="websiteUrl" type="url" placeholder="e.g. https://instagram.com/myrescues" {...register("websiteUrl")} />
        <FieldError message={errors.websiteUrl?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="imageUrl">Profile image URL (optional)</Label>
        <Input id="imageUrl" type="url" placeholder="e.g. https://your-bucket.s3.amazonaws.com/profile.jpg" {...register("imageUrl")} />
        <p className="text-xs text-muted-foreground">
          Paste a URL to your profile image. You can use the existing S3 upload system to host it.
        </p>
        <FieldError message={errors.imageUrl?.message} />
      </div>

      <Button type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? "Saving…" : profile ? "Update profile" : "Create profile"}
      </Button>
    </form>
  );
}

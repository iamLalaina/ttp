"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { createPetSchema, type CreatePetInput } from "@/schemas/pet.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiResponse } from "@/types/api.types";
import type { PetType } from "@/types/pet.types";

// ---------------------------------------------------------------------------
// Field error helper
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
// Typed select field helper — wraps Controller + Select for enum fields
// ---------------------------------------------------------------------------

interface SelectFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: { value: string; label: string }[];
}

function SelectField({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  options,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value || ""}
        onValueChange={(val: string | null) => {
          if (val !== null) onChange(val);
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enum option sets
// ---------------------------------------------------------------------------

const SPECIES_OPTIONS = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
];

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const VACCINATION_OPTIONS = [
  { value: "up_to_date", label: "Up to date" },
  { value: "partial", label: "Partial" },
  { value: "unknown", label: "Unknown" },
];

const YES_NO_UNKNOWN_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

// ---------------------------------------------------------------------------
// PetForm
// ---------------------------------------------------------------------------

/**
 * PetForm — Client Component
 *
 * Self-contained registration form for a new pet. Uses React Hook Form with
 * Zod resolver for client-side validation, then submits to POST /api/pets.
 * On success redirects to /pets/[id]. On error shows a global alert.
 */
export function PetForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePetInput>({
    resolver: zodResolver(createPetSchema),
    defaultValues: {
      name: "",
      breed: "",
      healthStatus: "",
      description: "",
      city: "",
      state: "",
    },
  });

  const descriptionValue = watch("description") ?? "";

  async function onSubmit(data: CreatePetInput) {
    setServerError(null);

    try {
      const response = await fetch("/api/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // TODO: pass real auth token (auth spec)
          // For now the stub accepts any non-empty token
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<PetType> = await response.json();

      if (!response.ok || result.error) {
        setServerError(
          result.error?.message ?? "An unexpected error occurred. Please try again.",
        );
        return;
      }

      router.push(`/pets/${result.data!.id}`);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-8"
      aria-label="Pet registration form"
    >
      {/* Global server error */}
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Registration failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 1 — Basic info                                              */}
      {/* ------------------------------------------------------------------ */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Basic information
        </legend>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Pet name</Label>
          <Input
            id="name"
            placeholder="e.g. Luna"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        {/* Species */}
        <Controller
          name="species"
          control={control}
          render={({ field }) => (
            <SelectField
              id="species"
              label="Species"
              placeholder="Select species"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.species?.message}
              options={SPECIES_OPTIONS}
            />
          )}
        />

        {/* Breed */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="breed">Breed</Label>
          <Input
            id="breed"
            placeholder="e.g. Labrador mix"
            aria-invalid={!!errors.breed}
            aria-describedby={errors.breed ? "breed-error" : undefined}
            {...register("breed")}
          />
          <FieldError message={errors.breed?.message} />
        </div>

        {/* Age in months */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ageInMonths">Estimated age (months)</Label>
          <Input
            id="ageInMonths"
            type="number"
            min={1}
            max={300}
            placeholder="e.g. 24"
            aria-invalid={!!errors.ageInMonths}
            aria-describedby={errors.ageInMonths ? "ageInMonths-error" : undefined}
            {...register("ageInMonths", { valueAsNumber: true })}
          />
          <FieldError message={errors.ageInMonths?.message} />
        </div>

        {/* Sex */}
        <Controller
          name="sex"
          control={control}
          render={({ field }) => (
            <SelectField
              id="sex"
              label="Sex"
              placeholder="Select sex"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.sex?.message}
              options={SEX_OPTIONS}
            />
          )}
        />

        {/* Size */}
        <Controller
          name="size"
          control={control}
          render={({ field }) => (
            <SelectField
              id="size"
              label="Size"
              placeholder="Select size"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.size?.message}
              options={SIZE_OPTIONS}
            />
          )}
        />
      </fieldset>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2 — Health & behavior                                       */}
      {/* ------------------------------------------------------------------ */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Health &amp; behavior
        </legend>

        {/* Health status */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="healthStatus">Health status</Label>
          <Textarea
            id="healthStatus"
            placeholder="Describe the pet's current health condition, any known issues, treatments, etc."
            rows={3}
            aria-invalid={!!errors.healthStatus}
            aria-describedby={errors.healthStatus ? "healthStatus-error" : undefined}
            {...register("healthStatus")}
          />
          <FieldError message={errors.healthStatus?.message} />
        </div>

        {/* Vaccination status */}
        <Controller
          name="vaccinationStatus"
          control={control}
          render={({ field }) => (
            <SelectField
              id="vaccinationStatus"
              label="Vaccination status"
              placeholder="Select vaccination status"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.vaccinationStatus?.message}
              options={VACCINATION_OPTIONS}
            />
          )}
        />

        {/* Sterilized */}
        <Controller
          name="sterilized"
          control={control}
          render={({ field }) => (
            <SelectField
              id="sterilized"
              label="Sterilized"
              placeholder="Select sterilization status"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.sterilized?.message}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          )}
        />

        {/* Friendly with children */}
        <Controller
          name="friendlyWithChildren"
          control={control}
          render={({ field }) => (
            <SelectField
              id="friendlyWithChildren"
              label="Friendly with children"
              placeholder="Select an option"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.friendlyWithChildren?.message}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          )}
        />

        {/* Friendly with other animals */}
        <Controller
          name="friendlyWithAnimals"
          control={control}
          render={({ field }) => (
            <SelectField
              id="friendlyWithAnimals"
              label="Friendly with other animals"
              placeholder="Select an option"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.friendlyWithAnimals?.message}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          )}
        />
      </fieldset>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3 — Location & description                                  */}
      {/* ------------------------------------------------------------------ */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Location &amp; description
        </legend>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g. Buenos Aires"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "city-error" : undefined}
            {...register("city")}
          />
          <FieldError message={errors.city?.message} />
        </div>

        {/* State */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">State / Province</Label>
          <Input
            id="state"
            placeholder="e.g. CABA"
            aria-invalid={!!errors.state}
            aria-describedby={errors.state ? "state-error" : undefined}
            {...register("state")}
          />
          <FieldError message={errors.state?.message} />
        </div>

        {/* Description with character counter */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Short description</Label>
          <Textarea
            id="description"
            placeholder="Write a short, engaging description about this pet's personality and story."
            rows={4}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "description-error" : "description-count"
            }
            {...register("description")}
          />
          <div className="flex items-start justify-between gap-2">
            <FieldError message={errors.description?.message} />
            <p
              id="description-count"
              aria-live="polite"
              className="ml-auto shrink-0 text-xs text-muted-foreground"
            >
              {descriptionValue.length} / 500
            </p>
          </div>
        </div>
      </fieldset>

      {/* ------------------------------------------------------------------ */}
      {/* Submit                                                               */}
      {/* ------------------------------------------------------------------ */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
        size="lg"
      >
        {isSubmitting ? "Registering pet…" : "Register pet"}
      </Button>
    </form>
  );
}

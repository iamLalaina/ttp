"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { updatePetSchema, type UpdatePetInput } from "@/schemas/pet.schema";
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
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Option sets
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

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft — not visible in catalog" },
  { value: "published", label: "Published — visible to adopters" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PetEditFormProps {
  pet: PetType;
}

// ---------------------------------------------------------------------------
// PetEditForm
// ---------------------------------------------------------------------------

/**
 * Client Component for editing an existing pet.
 * Pre-populates all fields with current pet data.
 * Submits via PATCH /api/pets/[id].
 */
export function PetEditForm({ pet }: PetEditFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePetInput>({
    resolver: zodResolver(updatePetSchema),
    defaultValues: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      ageInMonths: pet.ageInMonths,
      sex: pet.sex,
      size: pet.size,
      healthStatus: pet.healthStatus,
      vaccinationStatus: pet.vaccinationStatus,
      sterilized: pet.sterilized,
      friendlyWithChildren: pet.friendlyWithChildren,
      friendlyWithAnimals: pet.friendlyWithAnimals,
      description: pet.description,
      city: pet.city,
      state: pet.state,
      status: pet.status === "adopted" ? "draft" : pet.status,
    },
  });

  const descriptionValue = watch("description") ?? "";

  async function onSubmit(data: UpdatePetInput) {
    setServerError(null);

    try {
      const response = await fetch(`/api/pets/${pet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // TODO: pass real auth token (auth spec)
          Authorization: "Bearer stub-token",
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

      router.push(`/pets/${pet.id}`);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-8"
      aria-label="Edit pet form"
    >
      {/* Global server error */}
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Update failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Section 1 — Basic info */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Basic information
        </legend>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Pet name</Label>
          <Input
            id="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="breed">Breed</Label>
          <Input
            id="breed"
            aria-invalid={!!errors.breed}
            {...register("breed")}
          />
          <FieldError message={errors.breed?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ageInMonths">Estimated age (months)</Label>
          <Input
            id="ageInMonths"
            type="number"
            min={1}
            max={300}
            aria-invalid={!!errors.ageInMonths}
            {...register("ageInMonths", { valueAsNumber: true })}
          />
          <FieldError message={errors.ageInMonths?.message} />
        </div>

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

      {/* Section 2 — Health & behavior */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Health &amp; behavior
        </legend>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="healthStatus">Health status</Label>
          <Textarea
            id="healthStatus"
            rows={3}
            aria-invalid={!!errors.healthStatus}
            {...register("healthStatus")}
          />
          <FieldError message={errors.healthStatus?.message} />
        </div>

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

      {/* Section 3 — Location & description */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Location &amp; description
        </legend>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            aria-invalid={!!errors.city}
            {...register("city")}
          />
          <FieldError message={errors.city?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">State / Province</Label>
          <Input
            id="state"
            aria-invalid={!!errors.state}
            {...register("state")}
          />
          <FieldError message={errors.state?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Short description</Label>
          <Textarea
            id="description"
            rows={4}
            aria-invalid={!!errors.description}
            {...register("description")}
          />
          <div className="flex items-start justify-between gap-2">
            <FieldError message={errors.description?.message} />
            <p className="ml-auto shrink-0 text-xs text-muted-foreground">
              {descriptionValue.length} / 500
            </p>
          </div>
        </div>
      </fieldset>

      {/* Section 4 — Publication status */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Publication
        </legend>

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <SelectField
              id="status"
              label="Status"
              placeholder="Select status"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.status?.message}
              options={STATUS_OPTIONS}
            />
          )}
        />

        <p className="text-xs text-muted-foreground">
          A pet must have at least one photo to be published.
        </p>
      </fieldset>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
        size="lg"
      >
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUserFromCookies } from "@/lib/cognito";
import { getProfileForOwner } from "@/services/profile.service";
import { RescuerProfileForm } from "@/components/profile/RescuerProfileForm";

export const metadata: Metadata = {
  title: "My Profile",
};

/**
 * /profile — Private rescuer profile management page (Server Component).
 *
 * Shows the profile form pre-filled if a profile exists,
 * or empty for first-time creation.
 * Profiles are optional — users are not forced to create one.
 */
export default async function ProfilePage() {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    notFound();
  }

  const profile = await getProfileForOwner(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {profile ? "Edit your profile" : "Create your profile"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile
            ? "Update your public rescuer profile. This information is visible to potential adopters."
            : "Set up a public profile so potential adopters can learn about you. This is optional."}
        </p>
      </div>

      <RescuerProfileForm profile={profile} />
    </div>
  );
}

import Image from "next/image";
import { User, MapPin, Phone, ExternalLink } from "lucide-react";
import type { PublicRescuerProfile } from "@/types/profile.types";

interface PublicProfileViewProps {
  profile: PublicRescuerProfile;
}

/**
 * Public rescuer profile display (Server Component).
 * No edit controls — read-only.
 */
export function PublicProfileView({ profile }: PublicProfileViewProps) {
  return (
    <section className="space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt={profile.displayName}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="size-8 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{profile.displayName}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {profile.city}, {profile.state}
          </p>
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
        {profile.bio}
      </p>

      {/* Contact info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {profile.phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="size-3.5" />
            {profile.phone}
          </span>
        )}
        {profile.websiteUrl && (
          <a
            href={profile.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Website
          </a>
        )}
      </div>
    </section>
  );
}

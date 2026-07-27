import Image from "next/image";
import type { PetImageType } from "@/types/image.types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PetImageGalleryProps {
  images: PetImageType[];
  petName: string;
}

// ---------------------------------------------------------------------------
// PetImageGallery
// ---------------------------------------------------------------------------

/**
 * Read-only image gallery for the Pet Detail page (Server Component).
 *
 * Displays the primary image (order 0) as a large hero, and remaining
 * images in a responsive grid below. Shows an empty state if no photos exist.
 */
export function PetImageGallery({ images, petName }: PetImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No photos uploaded yet.
        </p>
      </div>
    );
  }

  const primaryImage = images[0];
  const secondaryImages = images.slice(1);

  return (
    <section aria-labelledby="gallery-heading" className="space-y-3">
      <h2 id="gallery-heading" className="sr-only">
        Pet photos
      </h2>

      {/* Primary image */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Image
          src={primaryImage.url}
          alt={`${petName} — primary photo`}
          width={800}
          height={533}
          className="aspect-[3/2] w-full object-cover"
          priority
          
        />
      </div>

      {/* Secondary images grid */}
      {secondaryImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {secondaryImages.map((img, index) => (
            <div
              key={img.id}
              className="overflow-hidden rounded-lg border border-border"
            >
              <Image
                src={img.url}
                alt={`${petName} — photo ${index + 2}`}
                width={400}
                height={267}
                className="aspect-[3/2] w-full object-cover"
                
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

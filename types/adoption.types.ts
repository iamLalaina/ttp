/**
 * Adoption request domain types.
 */

/** Input to create a new adoption request (public submission). */
export type CreateAdoptionRequestInput = {
  petId: string;
  applicantName: string;
  applicantEmail: string;
  message: string;
};

/** Full persisted adoption request record. */
export type AdoptionRequestType = {
  id: string;
  petId: string;
  applicantName: string;
  applicantEmail: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

/** Extended type for the owner inbox — includes pet details for display. */
export type AdoptionRequestWithPet = AdoptionRequestType & {
  petName: string;
  petPrimaryImageUrl: string | null;
};

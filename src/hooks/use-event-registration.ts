"use client";

import useSWR from "swr";
import { checkEventRegistration } from "@/api/competitions";
import type { EventRegistrationStatus } from "@/api/competitions";

export function useEventRegistration(eventSlug: string | undefined, userId: string | undefined) {
  return useSWR<EventRegistrationStatus>(
    eventSlug && userId ? `event-reg-${eventSlug}-${userId}` : null,
    () => checkEventRegistration(eventSlug!)
  );
}

"use client";

import useSWR from "swr";
import { getEventById, getEventImages, getEventSpeakers, getEventSponsors } from "@/api/events";
import type { ApiEvent, ApiImage, ApiSpeaker, ApiSponsor } from "@/api/events";

export function useEvent(eventId: string | undefined) {
  return useSWR<ApiEvent>(
    eventId ? `event-${eventId}` : null,
    () => getEventById(eventId!)
  );
}

export function useEventImages(eventId: string | undefined) {
  return useSWR<ApiImage[]>(
    eventId ? `event-images-${eventId}` : null,
    () => getEventImages(eventId!)
  );
}

export function useEventSpeakers(eventId: string | undefined) {
  return useSWR<ApiSpeaker[]>(
    eventId ? `event-speakers-${eventId}` : null,
    () => getEventSpeakers(eventId!)
  );
}

export function useEventSponsors(eventId: string | undefined) {
  return useSWR<ApiSponsor[]>(
    eventId ? `event-sponsors-${eventId}` : null,
    () => getEventSponsors(eventId!)
  );
}

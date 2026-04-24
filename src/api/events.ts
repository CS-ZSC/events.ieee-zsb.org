import api from ".";

// Interfaces based on expected data
export interface ApiEvent {
  id: number | string;
  name: string;
  description: string;
  overview?: string;
  image: string;
  logo?: string | null;
  cover_image?: string | null;
  link?: string;
  slug?: string;
}

export interface ApiImage {
  id: number;
  url: string;
}

export interface ApiSpeaker {
  id: number;
  name: string;
  title: string;
  image: string;
}

export interface ApiSponsor {
  id: number;
  name: string;
  logo: string;
  website_url: string | null;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

// 1. Get all events
export async function getEvents() {
  try {
    const { data } = await api.get<ApiResponse<ApiEvent[]>>("/eventsgate/events");
    return data.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

// Get event slug from event ID
export async function getEventSlugById(eventId: number): Promise<string> {
  const events = await getEvents();
  const event = events.find((e) => Number(e.id) === eventId);
  if (!event?.slug) throw new Error(`Event with ID ${eventId} not found`);
  return event.slug;
}

// 2. Get specific event details
export async function getEventById(eventId: string) {
  try {
    const { data } = await api.get<ApiResponse<ApiEvent>>(`/eventsgate/events/${eventId}`);
    // Handle cases where the API might return the object directly or wrapped in 'data'
    return data.data || data; 
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    throw error;
  }
}

// 3. Get event images
export async function getEventImages(eventId: string) {
  try {
    const { data } = await api.get<ApiResponse<ApiImage[]>>(`/eventsgate/events/${eventId}/images`);
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching images for event ${eventId}:`, error);
    throw error;
  }
}

// 4. Get event speakers
export async function getEventSpeakers(eventId: string) {
  try {
    const { data } = await api.get<ApiResponse<ApiSpeaker[]>>(`/eventsgate/events/${eventId}/speakers`);
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching speakers for event ${eventId}:`, error);
    throw error;
  }
}

// 5. Get event sponsors
export async function getEventSponsors(eventId: string) {
  try {
    const { data } = await api.get<ApiResponse<ApiSponsor[]>>(`/eventsgate/events/${eventId}/sponsors`);
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching sponsors for event ${eventId}:`, error);
    throw error;
  }
}

export async function isUserRegisteredForEvent(eventSlug: string, userId: number): Promise<boolean> {
  try {
    const { data } = await api.get<ApiResponse<{ registered: boolean }>>(`/eventsgate/events/${eventSlug}/check-registration`);
    return data.data?.registered === true;
  } catch {
    return false;
  }
}
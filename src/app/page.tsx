"use client";
import { Stack, Text } from "@chakra-ui/react";
import Container from "@/components/ui/internal/container";
import PageTitle from "@/components/ui/internal/page-title";
import { EventCard } from "@/components/ui/internal/home/event-card";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MoonLoader } from "react-spinners";

const Hero = dynamic(() => import("@/components/ui/internal/hero"), {
  loading: () => <MoonLoader size={50} />,
  ssr: false,
});

interface EventData {
  id: string | number;
  name: string;
  description: string;
  image: string;
  link?: string;
  slug?: string;
}

// Define Base URL: Fetches from .env file, falls back to direct URL if missing
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-ieee-zsb-org-zs9o.vercel.app";

export default function Home() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch list of events from the API
        const res = await fetch(`${BASE_URL}/api/eventsgate/events`);
        
        if (!res.ok) throw new Error("Failed to fetch events");
        
        const json = await res.json();
        setEvents(json.data); 
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("An error occurred while loading events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <Stack align={"center"} gap={5}>
      <Hero />
      <Container>
        <PageTitle title="Our events and competitions" />
        <Stack spaceY={4} mt={8} alignItems="center">
          
          {loading && <MoonLoader size={50} color="#00529B" />}
          {error && <Text color="red.500">{error}</Text>}
          {!loading && !error && events.length === 0 && (
            <Text>No events currently available.</Text>
          )}

          {!loading &&
            !error &&
            events.map((event) => (
              <EventCard
                key={event.id}
                name={event.name}
                description={event.description}
                image={event.image}
                // Build dynamic URL based on event slug or id (e.g., /events/pesday)
                link={event.link || `/events/${event.slug || event.name.toLowerCase().replace(/\s+/g, '')}`} 
              />
            ))}
        </Stack>
      </Container>
    </Stack>
  );
}
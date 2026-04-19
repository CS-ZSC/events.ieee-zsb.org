"use client";

import { useEffect, useState } from "react";
import { Stack, Text, Flex } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { MoonLoader } from "react-spinners";

// Import your custom UI components
import Container from "@/components/ui/internal/container";
import PageTitle from "@/components/ui/internal/page-title";
import { EventCard } from "@/components/ui/internal/home/event-card";

// Import the new API function
import { getEvents, ApiEvent } from "@/api/events";
import { API_LINK } from "@/api";

// Dynamically load the Hero component
const Hero = dynamic(() => import("@/components/ui/internal/hero"), {
  loading: () => (
    <Flex justify="center" align="center" h="40vh">
      <MoonLoader size={50} color="var(--chakra-colors-primary-1)" />
    </Flex>
  ),
  ssr: false,
});

export default function Home() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventsList = async () => {
      try {
        setLoading(true);
        // Using the clean API function we created
        const eventsData = await getEvents();
        setEvents(eventsData || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("An error occurred while loading events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventsList();
  }, []);

  return (
    <Stack align={"center"} gap={5}>
      <Hero />
      <Container>
        <PageTitle title="Our events and competitions" />
        <Stack spaceY={4} mt={8} alignItems="center">

          {loading && (
            <Flex justify="center" my={10}>
              <MoonLoader size={50} color="var(--chakra-colors-primary-1)" />
            </Flex>
          )}

          {error && (
            <Text color="red.500" fontSize="lg">
              {error}
            </Text>
          )}

          {!loading && !error && events.length === 0 && (
            <Text color="gray.500" fontSize="lg">
              No events currently available.
            </Text>
          )}

          {!loading &&
            !error &&
            events.map((event) => (
              <EventCard
                key={event.id} // Replaced event.name with event.id for better React key tracking
                name={event.name}
                description={event.description}
                // Fallback to a placeholder if the API doesn't provide an image
                image={`${API_LINK}/storage/${event.cover_image}` || "https://via.placeholder.com/800x400?text=Event+Image"}
                // Build dynamic URL based on event slug or ID
                link={event.link || `/events/${event.slug || event.id}`}
              />
            ))}
        </Stack>
      </Container>
    </Stack>
  );
}
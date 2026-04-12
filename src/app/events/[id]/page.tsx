"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Flex, Text, Box, Image } from "@chakra-ui/react";
import { MoonLoader } from "react-spinners";

// Importing your custom UI components to maintain exact Dark/Light mode styles
import PageWrapper from "@/components/ui/internal/page-wrapper";
import HeroSection from "@/components/ui/internal/events/mutex/hero-section";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import AlternativeText from "@/components/ui/internal/alternative-text";

// Define Base URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-ieee-zsb-org-zs9o.vercel.app";

export default function EventDetails() {
  const params = useParams();
  // Extract the event ID or Slug
  const eventId = params?.id as string; 

  const [eventData, setEventData] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!eventId) return;

      try {
        setLoading(true);

        // 1. Fetch Event Details
        const eventRes = await fetch(`${BASE_URL}/api/eventsgate/events/${eventId}`);
        if (!eventRes.ok) throw new Error("Event not found");
        const eventJson = await eventRes.json();
        setEventData(eventJson.data || eventJson);

        // 2. Fetch Images
        try {
          const imgRes = await fetch(`${BASE_URL}/api/eventsgate/events/${eventId}/images`);
          const imgJson = await imgRes.json();
          setImages(imgJson.data || []);
        } catch (e) { console.error("Images fetch failed", e); }

        // 3. Fetch Speakers
        try {
          const speakersRes = await fetch(`${BASE_URL}/api/eventsgate/events/${eventId}/speakers`);
          const speakersJson = await speakersRes.json();
          setSpeakers(speakersJson.data || []);
        } catch (e) { console.error("Speakers fetch failed", e); }

        // 4. Fetch Sponsors
        try {
          const sponsorsRes = await fetch(`${BASE_URL}/api/eventsgate/events/${eventId}/sponsors`);
          const sponsorsJson = await sponsorsRes.json();
          setSponsors(sponsorsJson.data || []);
        } catch (e) { console.error("Sponsors fetch failed", e); }

      } catch (err) {
        console.error("Error loading event page:", err);
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [eventId]);

  // Show your custom PageWrapper while loading
  if (loading) {
    return (
      <PageWrapper>
        <Flex justify="center" align="center" h="50vh">
          <MoonLoader size={50} color="#00529B" />
        </Flex>
      </PageWrapper>
    );
  }

  // Show your custom PageWrapper on error
  if (error || !eventData) {
    return (
      <PageWrapper>
        <Flex justify="center" align="center" h="50vh">
          <Text color="red.500" fontSize="xl">{error || "Event not found"}</Text>
        </Flex>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Flex
        flexDirection={"column"}
        alignItems="center"
        justifyContent="center"
        gap={20}
        maxWidth={"1300px"}
        mx={"auto"}
        mb={16}
      >
        {/* === HERO SECTION === */}
        {/* Using your custom HeroSection */}
        <HeroSection
          title={eventData.name}
          description={eventData.description}
          imagePath={images.length > 0 ? images[0].url : (eventData.image || "")}
          buttonLink={eventData.link || "#"}
        />

        {/* === OVERVIEW SECTION === */}
        {/* Using your exact SectionContainer and Titles */}
        <SectionContainer>
          <SectionTitle title="Overview" />
          <SectionDescription
            description={eventData.overview || eventData.description || "No overview available."}
          />
        </SectionContainer>

        {/* === COMPETITIONS SECTION === */}
        {/* TASK: This section is assigned to Mohamed Khaled */}
        <SectionContainer>
          <SectionTitle title="Competitions" />
          <SectionDescription description="Explore our diverse set of competitions." />
          {/* Note: Mohamed Khaled will implement the competitions UI here */}
        </SectionContainer>

        {/* === SPEAKERS SECTION === */}
        <SectionContainer>
          <SectionTitle title="Speakers" />
          {speakers.length === 0 ? (
            // Using your custom AlternativeText component
            <AlternativeText text="Stay tuned for our speakers announcements!" />
          ) : (
            <Flex flexWrap="wrap" justify="center" gap={8} mt={10}>
              {speakers.map((speaker: any) => (
                <Flex key={speaker.id} direction="column" align="center">
                   <Box width="150px" height="150px" overflow="hidden" borderRadius="full" mb={4}>
                      <Image src={speaker.image || "https://via.placeholder.com/150?text=No+Photo"} alt={speaker.name} objectFit="cover" w="100%" h="100%" />
                   </Box>
                   <Text fontWeight="bold" color="neutral-1" fontSize="xl" mb={1}>{speaker.name}</Text>
                   <Text color="neutral-2" fontSize="md">{speaker.title}</Text>
                </Flex>
              ))}
            </Flex>
          )}
        </SectionContainer>

        {/* === SPONSORS SECTION === */}
        <SectionContainer>
          <SectionTitle title="Sponsors" />
          {sponsors.length === 0 ? (
            <AlternativeText text="Stay tuned for our sponsors announcements!" />
          ) : (
            <Flex flexWrap="wrap" justify="center" gap={8} mt={10}>
              {sponsors.map((sponsor: any) => (
                <Flex key={sponsor.id} align="center" justify="center" p={4}>
                   <Image src={sponsor.logo || "https://via.placeholder.com/150?text=No+Logo"} alt={sponsor.name} maxH="100px" objectFit="contain" />
                </Flex>
              ))}
            </Flex>
          )}
        </SectionContainer>

      </Flex>
    </PageWrapper>
  );
}
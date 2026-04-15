"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Flex, Text, Box, Image } from "@chakra-ui/react";
import { MoonLoader } from "react-spinners";

// Import your custom UI components
import PageWrapper from "@/components/ui/internal/page-wrapper";
import HeroSection from "@/components/ui/internal/events/mutex/hero-section";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import AlternativeText from "@/components/ui/internal/alternative-text";

// Import the new toaster utility for Chakra v3
import { toaster } from "@/components/ui/toaster";

// Import the API functions and the Axios instance
import { 
  getEventById, 
  getEventImages, 
  getEventSpeakers, 
  getEventSponsors,
  ApiEvent,
  ApiImage,
  ApiSpeaker,
  ApiSponsor
} from "@/api/events";
import api from "@/api";
import Competitions from "@/components/ui/internal/events/mutex/competitions";

export default function EventDetails() {
  const params = useParams();
  const eventId = params?.id as string; 

  // --- DATA STATES ---
  const [eventData, setEventData] = useState<ApiEvent | null>(null);
  const [images, setImages] = useState<ApiImage[]>([]);
  const [speakers, setSpeakers] = useState<ApiSpeaker[]>([]);
  const [sponsors, setSponsors] = useState<ApiSponsor[]>([]);
  
  // --- UI STATES ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- REGISTRATION STATES (TASK 8) ---
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Storing the participant ID for Mohamed's task
  const [participantId, setParticipantId] = useState<string | number | null>(null);

  // --- DATA FETCHING (PROMISE.ALL) ---
  useEffect(() => {
    const fetchAllData = async () => {
      if (!eventId) return;

      try {
        setLoading(true);

        const [eventRes, imagesRes, speakersRes, sponsorsRes] = await Promise.all([
          getEventById(eventId),
          getEventImages(eventId).catch(() => []), 
          getEventSpeakers(eventId).catch(() => []),
          getEventSponsors(eventId).catch(() => [])
        ]);

        setEventData(eventRes);
        setImages(imagesRes);
        setSpeakers(speakersRes);
        setSponsors(sponsorsRes);

      } catch (err) {
        console.error("Error loading main event details:", err);
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [eventId]);

  // --- REGISTRATION LOGIC ---
  const handleRegisterToggle = async () => {
    setIsRegistering(true);

    if (isRegistered) {
      // --- UNREGISTER LOGIC (DELETE) ---
      try {
        await api.delete(`/eventsgate/events/${eventId}/unregister`, {
          data: { role: "competitor" } 
        });

        setParticipantId(null);
        setIsRegistered(false);
        toaster.create({ title: "Unregistered Successfully", type: "info", duration: 3000 });
        
      } catch (err: any) {
        console.error("Unregister error:", err);
        if (err.response?.status === 401) {
          toaster.create({ title: "Authentication required", description: "Please log in first.", type: "warning" });
        } else {
          toaster.create({ title: "Failed to unregister", type: "error" });
        }
      }
    } else {
      // --- REGISTER LOGIC (POST) ---
      try {
        const response = await api.post(`/eventsgate/events/${eventId}/register`, {
          role: "competitor"
        });

        const newParticipantId = response.data?.event_participant_id || response.data?.data?.event_participant_id;
        setParticipantId(newParticipantId); 
        
        setIsRegistered(true);
        toaster.create({ title: "Registered Successfully!", type: "success", duration: 3000 });

      } catch (err: any) {
        console.error("Register error:", err);
        if (err.response?.status === 401) {
          toaster.create({ title: "Authentication required", description: "Please log in to register.", type: "warning" });
        } else {
          toaster.create({ title: "Registration Failed", description: "Please try again later.", type: "error" });
        }
      }
    }
    
    setIsRegistering(false);
  };

  // --- RENDER LOADERS/ERRORS ---
  if (loading) {
    return (
      <PageWrapper>
        <Flex justify="center" align="center" h="50vh">
          <MoonLoader size={50} color="#00529B" />
        </Flex>
      </PageWrapper>
    );
  }

  if (error || !eventData) {
    return (
      <PageWrapper>
        <Flex justify="center" align="center" h="50vh">
          <Text color="red.500" fontSize="xl">{error || "Event not found"}</Text>
        </Flex>
      </PageWrapper>
    );
  }

  // --- MAIN RENDER ---
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
        <HeroSection
          title={eventData.name}
          description={eventData.description}
          imagePath={(images && images.length > 0 && images[0].url) ? images[0].url : (eventData.image || "https://via.placeholder.com/800x400?text=Image+Coming+Soon")}
          imageAlt={`${eventData.name} main event image`}
          onRegisterClick={handleRegisterToggle}
          isRegistered={isRegistered}
          isLoading={isRegistering}
        />

        {/* === OVERVIEW SECTION === */}
        <SectionContainer>
          <SectionTitle title="Overview" />
          <SectionDescription
            description={eventData.overview || eventData.description || "No overview available."}
          />
        </SectionContainer>

        {/* === COMPETITIONS SECTION === */}
        <Competitions
          eventSlug={eventData.slug || eventId}
          eventId={eventData.id}
          competitionsDescription="Explore our diverse set of competitions."
        />

        {/* === SPEAKERS SECTION === */}
        <SectionContainer>
          <SectionTitle title="Speakers" />
          {speakers.length === 0 ? (
            <AlternativeText text="Stay tuned for our speakers announcements!" />
          ) : (
            <Flex flexWrap="wrap" justify="center" gap={8} mt={10}>
              {speakers.map((speaker) => (
                <Flex key={speaker.id} direction="column" align="center">
                   <Box width="150px" height="150px" overflow="hidden" borderRadius="full" mb={4}>
                      <Image 
                        src={speaker.image || "https://via.placeholder.com/150?text=No+Photo"} 
                        alt={`${speaker.name} profile picture`} 
                        objectFit="cover" 
                        w="100%" 
                        h="100%" 
                      />
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
              {sponsors.map((sponsor) => (
                <Flex key={sponsor.id} align="center" justify="center" p={4}>
                   <Image 
                     src={sponsor.logo || "https://via.placeholder.com/150?text=No+Logo"} 
                     alt={`${sponsor.name} logo`} 
                     maxH="100px" 
                     objectFit="contain" 
                   />
                </Flex>
              ))}
            </Flex>
          )}
        </SectionContainer>

      </Flex>
    </PageWrapper>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import { Box, Flex, Text, Image } from "@chakra-ui/react";
import { MoonLoader } from "react-spinners";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import AlternativeText from "@/components/ui/internal/alternative-text";
import PrizesSection from "@/components/ui/internal/events/mutex/prizes-section";
import NavButton from "@/components/ui/internal/nav-button";
import {
  getCompetitionById,
  type ApiCompetition,
} from "@/api/competitions";
import { getEventById, type ApiEvent } from "@/api/events";
import { useWindowType } from "@/hooks/use-window-type";

export default function CompetitionPage() {
  const params = useParams();
  const id = params?.id as string;
  const { isMobile } = useWindowType();

  const [competition, setCompetition] = useState<ApiCompetition | null>(null);
  const [eventData, setEventData] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const competitionId = parseInt(id, 10);
    if (isNaN(competitionId)) {
      setError("Invalid competition ID");
      setLoading(false);
      return;
    }

    let cancelled = false;

    getCompetitionById(competitionId)
      .then((comp) => {
        if (cancelled) return;
        setCompetition(comp);
        // Fetch event image separately — don't block the page if it fails
        getEventById("mutex")
          .then((ev) => { if (!cancelled) setEventData(ev); })
          .catch((err) => console.warn("Failed to load event image:", err));
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load competition details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <PageWrapper>
        <Flex justify="center" align="center" h="50vh">
          <MoonLoader size={50} color="#006699" />
        </Flex>
      </PageWrapper>
    );
  }

  if (error || !competition) {
    return (
      <PageWrapper>
        <Flex justify="center" align="center" h="50vh">
          <Text color="red.500" fontSize="xl">
            {error || "Competition not found"}
          </Text>
        </Flex>
      </PageWrapper>
    );
  }

  // Use event cover_image/logo from backend, or fall back to local image
  const eventImage =
    eventData?.cover_image ||
    eventData?.logo ||
    `/events/mutex/mutex.webp`;

  return (
    <PageWrapper>
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={20}
        maxWidth="1300px"
        mx="auto"
        mb={16}
      >
        {/* === HERO SECTION === */}
        <Flex
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems="center"
          flexDirection="row-reverse"
          gap={6}
          width="100%"
        >
          <Flex
            bgColor="primary-5"
            border="1px solid"
            borderColor="primary-3"
            rounded="2xl"
            align="center"
            justify="center"
            overflow="hidden"
            w={isMobile ? "full" : "444px"}
            h="318px"
            mx={isMobile ? "auto" : "0"}
          >
            <Image
              src={eventImage}
              alt={competition.name}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          </Flex>
          <Flex
            flexDir="column"
            maxWidth="600px"
            gap={4}
            mx={isMobile ? "auto" : "0"}
            justifyContent={isMobile ? "center" : "flex-start"}
            alignItems={isMobile ? "center" : "flex-start"}
          >
            <Text fontSize="4xl" color="neutral-1" fontWeight="bold">
              {competition.name}
            </Text>
            <Text color="neutral-2" whiteSpace="pre-line">
              {competition.overview}
            </Text>
            <Flex gap={3} flexWrap="wrap">
              <Box
                bg="primary-5"
                border="1px solid"
                borderColor="primary-3"
                rounded="full"
                px={4}
                py={1.5}
              >
                <Text color="primary-1" fontWeight="600" fontSize="sm">
                  {competition.type === "team" ? "Team" : "Individual"}
                </Text>
              </Box>
              {competition.type === "team" && competition.max_team_members > 0 && (
                <Box
                  bg="primary-5"
                  border="1px solid"
                  borderColor="primary-3"
                  rounded="full"
                  px={4}
                  py={1.5}
                >
                  <Text color="primary-1" fontWeight="600" fontSize="sm">
                    Up to {competition.max_team_members} members
                  </Text>
                </Box>
              )}
            </Flex>
            <Flex gap={4} flexWrap="wrap">
              <NavButton
                link={`/events/mutex/registration`}
                text="Register now!"
              />
            </Flex>
          </Flex>
        </Flex>

        {/* === PRIZES / TROPHIES SECTION (from API) === */}
        <PrizesSection
          competitionId={competition.id}
          description={
            competition.type === "team"
              ? `Team competition (up to ${competition.max_team_members} members)`
              : "Individual competition"
          }
        />

        {/* === REGISTER CTA === */}
        <SectionContainer>
          <SectionDescription description="What are you waiting for? Register now!" />
          <NavButton
            link={`/events/mutex/registration`}
            text="Register Now"
          />
        </SectionContainer>
      </Flex>
    </PageWrapper>
  );
}
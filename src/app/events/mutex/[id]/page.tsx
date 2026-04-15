"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import { Box, Button, Flex, Text, Image } from "@chakra-ui/react";
import { MoonLoader } from "react-spinners";
import SectionDescription from "@/components/ui/internal/section-description";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import PrizesSection from "@/components/ui/internal/events/mutex/prizes-section";
import { toaster } from "@/components/ui/toaster";
import {
  getCompetitionById,
  registerForCompetition,
  unregisterFromCompetition,
  ensureEventRegistration,
  isUserRegisteredForCompetition,
  type ApiCompetition,
} from "@/api/competitions";
import { getEventById, type ApiEvent } from "@/api/events";
import { useWindowType } from "@/hooks/use-window-type";
import { useAuth } from "@/atoms/auth";
import { FiUserPlus, FiUserMinus } from "react-icons/fi";

export default function CompetitionPage() {
  const params = useParams();
  const id = params?.id as string;
  const { isMobile } = useWindowType();
  const userData = useAuth();

  const [competition, setCompetition] = useState<ApiCompetition | null>(null);
  const [eventData, setEventData] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- REGISTRATION STATES ---
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
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
        getEventById("mutex")
          .then((ev) => { if (!cancelled) setEventData(ev); })
          .catch((err) => console.warn("Failed to load event image:", err));

        // Check if user is already registered for this competition
        if (userData?.id) {
          setCheckingRegistration(true);
          isUserRegisteredForCompetition(competitionId, Number(userData.id))
            .then((registered) => { if (!cancelled) setIsRegistered(registered); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setCheckingRegistration(false); });
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load competition details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, userData?.id]);

  // --- REGISTRATION LOGIC ---
  const handleRegisterToggle = async () => {
    if (!userData?.id) {
      toaster.create({ title: "Authentication required", description: "Please log in to register.", type: "warning" });
      return;
    }
    if (isRegistering) return;
    if (!competition) return;
    setIsRegistering(true);

    if (isRegistered) {
      // --- UNREGISTER FROM COMPETITION ---
      try {
        await unregisterFromCompetition(competition.id);
        setIsRegistered(false);
        toaster.create({ title: "Unregistered from competition", type: "info", duration: 3000 });
      } catch (err: any) {
        console.error("Unregister error:", err);
        const status = err.response?.status;
        const message = err.response?.data?.message;
        if (status === 401) {
          toaster.create({ title: "Authentication required", description: "Please log in first.", type: "warning" });
        } else if (status === 404) {
          // Not registered anyway — sync state
          setIsRegistered(false);
        } else {
          toaster.create({ title: "Failed to unregister", description: message || "Please try again later.", type: "error" });
        }
      }
    } else {
      // --- REGISTER FOR COMPETITION (two-step) ---
      try {
        // Step 1: Ensure user is registered for the parent event
        await ensureEventRegistration("mutex");

        // Step 2: Register for the competition (no body needed)
        await registerForCompetition(competition.id);
        setIsRegistered(true);
        toaster.create({ title: "Registered Successfully!", type: "success", duration: 3000 });
      } catch (err: any) {
        console.error("Register error:", err);
        const status = err.response?.status;
        const message = err.response?.data?.message || "";

        if (status === 401) {
          toaster.create({ title: "Authentication required", description: "Please log in to register.", type: "warning" });
        } else if (status === 403) {
          toaster.create({ title: "Cannot register", description: message || "You don't have permission to register.", type: "warning" });
        } else if (status === 409) {
          // Already registered for a competition in this event
          if (message.toLowerCase().includes("competition")) {
            setIsRegistered(true);
          }
          toaster.create({ title: "Already registered", description: message, type: "info" });
        } else if (status === 422) {
          toaster.create({ title: "Team competition", description: "Team registration coming soon.", type: "info" });
        } else {
          toaster.create({ title: "Registration Failed", description: message || "Please try again later.", type: "error" });
        }
      }
    }

    setIsRegistering(false);
  };

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
              {competition.type === "team" ? (
                <Text color="neutral-2" fontSize="sm" fontStyle="italic">
                  Team registration coming soon
                </Text>
              ) : (
                <Button
                  onClick={handleRegisterToggle}
                  loading={isRegistering || checkingRegistration}
                  bg={isRegistered ? "transparent" : "primary-1"}
                  color={isRegistered ? "red.400" : "white"}
                  borderWidth="2px"
                  borderColor={isRegistered ? "red.400" : "transparent"}
                  _hover={{
                    bg: isRegistered ? "red.600" : "primary-2",
                    color: "white",
                    borderColor: isRegistered ? "red.600" : "transparent",
                  }}
                  w="179px"
                  px="25px"
                  py="8px"
                  borderRadius="10px"
                  fontWeight="bold"
                  fontSize="18px"
                  transition="all 0.2s ease"
                >
                  {isRegistered ? <FiUserMinus /> : <FiUserPlus />}
                  {isRegistered ? "Unregister" : "Register Now!"}
                </Button>
              )}
            </Flex>
          </Flex>
        </Flex>

        {/* === PRIZES SECTION (from API) === */}
        <PrizesSection
          competitionId={competition.id}
          description={
            competition.type === "team"
              ? `Team competition (up to ${competition.max_team_members} members)`
              : "Individual competition"
          }
        />

        {/* === REGISTER CTA === */}
        {competition.type !== "team" && (
          <SectionContainer>
            <SectionDescription description={isRegistered ? "You are registered for this competition!" : "What are you waiting for? Register now!"} />
            <Button
              onClick={handleRegisterToggle}
              loading={isRegistering || checkingRegistration}
              bg={isRegistered ? "transparent" : "primary-1"}
              color={isRegistered ? "red.400" : "white"}
              borderWidth="2px"
              borderColor={isRegistered ? "red.400" : "transparent"}
              _hover={{
                bg: isRegistered ? "red.600" : "primary-2",
                color: "white",
                borderColor: isRegistered ? "red.600" : "transparent",
              }}
              w="179px"
              px="25px"
              py="8px"
              borderRadius="10px"
              fontWeight="bold"
              fontSize="18px"
              transition="all 0.2s ease"
            >
              {isRegistered ? <FiUserMinus /> : <FiUserPlus />}
              {isRegistered ? "Unregister" : "Register Now!"}
            </Button>
          </SectionContainer>
        )}
      </Flex>
    </PageWrapper>
  );
}

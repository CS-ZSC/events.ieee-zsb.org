"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Flex, Text, Box, Image, Button, Portal } from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react";
import { MoonLoader } from "react-spinners";
import { Icon } from "@iconify/react";
import { FiUserPlus, FiUserMinus, FiAlertTriangle } from "react-icons/fi";

// Import your custom UI components
import PageWrapper from "@/components/ui/internal/page-wrapper";
import HeroSection from "@/components/ui/internal/events/mutex/hero-section";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import AlternativeText from "@/components/ui/internal/alternative-text";
import Breadcrumb from "@/components/ui/internal/breadcrumb";

// Import the new toaster utility for Chakra v3
import { toaster } from "@/components/ui/toaster";

// Import the API functions and the Axios instance
import {
  ensureEventRegistration,
  checkCompetitionRegistration,
  getCompetitions,
} from "@/api/competitions";
import api, { API_LINK } from "@/api";
import Competitions from "@/components/ui/internal/events/mutex/competitions";
import { useAuth } from "@/atoms/auth";
import { useEvent, useEventImages, useEventSpeakers, useEventSponsors } from "@/hooks/use-event";
import { useEventRegistration } from "@/hooks/use-event-registration";

export default function EventDetails() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const userData = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- DATA FETCHING (SWR) ---
  const { data: eventData, isLoading: loadingEvent, error: eventError } = useEvent(eventId);
  const { data: images } = useEventImages(eventId);
  const { data: speakers } = useEventSpeakers(eventId);
  const { data: sponsors } = useEventSponsors(eventId);
  const { data: regStatus, isLoading: checkingRegistration, mutate: mutateRegistration } = useEventRegistration(
    eventData?.slug || eventId,
    userData?.id
  );

  const loading = loadingEvent;
  const error = eventError ? "Failed to load event details." : null;
  const isRegistered = regStatus?.registered ?? false;
  const eventRole = regStatus?.role || null;

  // Show a nudge toast when returning from login with action=register
  useEffect(() => {
    if (searchParams.get("action") === "register") {
      toaster.create({
        title: "You're logged in!",
        description: "Now click 'Get Ticket' to register for this event.",
        type: "info",
        duration: 6000,
      });
      router.replace(`/events/${eventId}`);
    }
  }, []);

  // --- UI STATES ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showUnregisterDialog, setShowUnregisterDialog] = useState(false);
  const [competitionNames, setCompetitionNames] = useState<string[]>([]);
  const [loadingUnregisterInfo, setLoadingUnregisterInfo] = useState(false);

  // --- REGISTRATION LOGIC ---
  const handleRegisterToggle = () => {
    if (!userData?.id) {
      toaster.create({
        title: "Login required",
        description: "You'll be redirected to login. After signing in, come back here to pick up your ticket.",
        type: "warning",
        duration: 4000,
      });
      setTimeout(() => {
        const redirectUrl = `/events/${eventId}?action=register`;
        router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      }, 1500);
      return;
    }
    if (isRegistering) return;

    if (isRegistered) {
      setShowUnregisterDialog(true);
      // Fetch competition registrations for the warning
      if (eventData) {
        setLoadingUnregisterInfo(true);
        setCompetitionNames([]);
        getCompetitions()
          .then((comps) => {
            const eventComps = comps.filter((c) => String(c.event_id) === String(eventData.id));
            return Promise.all(
              eventComps.map((c) =>
                checkCompetitionRegistration(c.id)
                  .then((s) => (s.registered ? c.name : null))
                  .catch(() => null)
              )
            );
          })
          .then((results) => {
            setCompetitionNames(results.filter((n): n is string => n !== null));
          })
          .catch(() => { })
          .finally(() => setLoadingUnregisterInfo(false));
      }
    } else {
      setShowRegisterDialog(true);
    }
  };

  const handleConfirmRegister = async () => {
    if (!eventData || isRegistering) return;
    setIsRegistering(true);
    const slug = eventData.slug || eventId;
    try {
      await ensureEventRegistration(slug, "spectator");
      mutateRegistration({ registered: true, role: "spectator" }, false);
      setShowRegisterDialog(false);
      toaster.create({ title: "Registered!", description: "You have been registered as an attendee. A ticket has been added to your profile.", type: "success", duration: 5000 });
    } catch (err: any) {
      const message = err.response?.data?.message || "Registration failed. Please try again.";
      if (err.response?.status === 409) {
        mutateRegistration({ registered: true }, false);
        setShowRegisterDialog(false);
        toaster.create({ title: "Already registered", description: message, type: "info" });
      } else if (err.response?.status === 401) {
        toaster.create({ title: "Authentication required", description: "Please log in to register.", type: "warning" });
      } else {
        toaster.create({ title: "Registration Failed", description: message, type: "error" });
      }
    }
    setIsRegistering(false);
  };

  const handleConfirmUnregister = async () => {
    if (!eventData || isRegistering) return;
    setIsRegistering(true);
    try {
      await api.delete(`/eventsgate/events/${eventData.slug || eventId}/unregister`);
      mutateRegistration({ registered: false }, false);
      setShowUnregisterDialog(false);
      toaster.info({ title: "Unregistered Successfully", duration: 3000 });
    } catch (err: any) {
      if (err.response?.status === 401) {
        toaster.create({ title: "Authentication required", description: "Please log in first.", type: "warning" });
      } else {
        toaster.create({ title: "Failed to unregister", description: err.response?.data?.message || "Please try again.", type: "error" });
      }
    }
    setIsRegistering(false);
  };

  // --- RENDER LOADERS/ERRORS ---
  if (loading) {
    return (
      <PageWrapper>
        <Flex justify="center" align="center" h="50vh">
          <MoonLoader size={50} color="var(--chakra-colors-primary-1)" />
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
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: eventData.name },
        ]}
      />
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
          imagePath={`${API_LINK}/storage/${eventData.cover_image}`}
          imageAlt={`${eventData.name} main event image`}
          onRegisterClick={handleRegisterToggle}
          isRegistered={isRegistered}
          isLoading={isRegistering || checkingRegistration}
        />

        {/* === TICKET INFO (registered attendee) === */}
        {isRegistered && (
          <Box
            bg="primary-5"
            border="1px solid"
            borderColor="primary-3"
            rounded="xl"
            px={6}
            py={4}
            w="100%"
          >
            <Flex align="center" gap={3} flexWrap="wrap" justify="space-between">
              <Flex align="center" gap={3}>
                <Icon icon="mdi:ticket-confirmation-outline" width={24} color="var(--chakra-colors-primary-1)" />
                <Flex flexDir="column">
                  <Text color="neutral-1" fontWeight="bold" fontSize="md">
                    You&apos;re registered{eventRole ? ` as a ${eventRole}` : ""}
                  </Text>
                  <Text color="neutral-3" fontSize="sm">
                    Your ticket is available in your profile.
                  </Text>
                </Flex>
              </Flex>
              <Link href="/profile/tickets">
                <Button
                  bg="primary-1"
                  color="white"
                  _hover={{ bg: "primary-2" }}
                  px={4}
                  py={2}
                  borderRadius="8px"
                  fontWeight="bold"
                  fontSize="14px"
                >
                  <Icon icon="mdi:ticket" width={16} />
                  View Tickets
                </Button>
              </Link>
            </Flex>
          </Box>
        )}

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
          {(speakers ?? []).length === 0 ? (
            <AlternativeText text="Stay tuned for our speakers announcements!" />
          ) : (
            <Flex flexWrap="wrap" justify="center" gap={8} mt={10}>
              {(speakers ?? []).map((speaker) => (
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
          {(sponsors ?? []).length === 0 ? (
            <AlternativeText text="Stay tuned for our sponsors announcements!" />
          ) : (
            <Flex flexWrap="wrap" justify="center" gap={8} mt={10}>
              {(sponsors ?? []).map((sponsor) => (
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

      {/* Spectator Registration Confirmation Dialog */}
      <Dialog.Root
        open={showRegisterDialog}
        onOpenChange={(e) => { if (!e.open) setShowRegisterDialog(false); }}
        size="sm"
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="primary-5"
              border="1px solid"
              borderColor="primary-3"
              borderRadius="10px"
              color="neutral-1"
              p={6}
            >
              <Flex flexDir="column" gap={4} align="center" textAlign="center">
                <Icon icon="mdi:eye-outline" width={40} color="var(--chakra-colors-primary-1)" />
                <Dialog.Title fontSize="lg" fontWeight="bold" color="neutral-1">
                  Attend as Spectator?
                </Dialog.Title>
                <Text color="neutral-3" fontSize="sm">
                  You will be registered as a spectator for <strong>{eventData.name}</strong>. A ticket will appear in your profile. You can unregister later.
                </Text>
                <Flex gap={3} w="100%">
                  <Button
                    flex={1}
                    bg="transparent"
                    color="neutral-2"
                    borderWidth="2px"
                    borderColor="primary-3"
                    _hover={{ bg: "primary-4" }}
                    borderRadius="8px"
                    fontWeight="bold"
                    onClick={() => setShowRegisterDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    flex={1}
                    bg="primary-1"
                    color="white"
                    _hover={{ bg: "primary-2" }}
                    borderRadius="8px"
                    fontWeight="bold"
                    loading={isRegistering}
                    onClick={handleConfirmRegister}
                  >
                    <Icon icon="mdi:ticket-confirmation-outline" width={18} />
                    Register
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Unregister Confirmation Dialog */}
      <Dialog.Root
        open={showUnregisterDialog}
        onOpenChange={(e) => { if (!e.open) setShowUnregisterDialog(false); }}
        size="sm"
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="primary-5"
              border="1px solid"
              borderColor="primary-3"
              borderRadius="10px"
              color="neutral-1"
              p={6}
            >
              <Flex flexDir="column" gap={4} align="center" textAlign="center">
                <FiAlertTriangle size={40} color="var(--chakra-colors-red-400)" />
                <Dialog.Title fontSize="lg" fontWeight="bold" color="neutral-1">
                  Unregister from Event?
                </Dialog.Title>
                <Text color="neutral-3" fontSize="sm">
                  You are currently registered as <strong>{eventRole || "attendee"}</strong> for <strong>{eventData.name}</strong>.
                </Text>
                {loadingUnregisterInfo ? (
                  <MoonLoader size={20} color="var(--chakra-colors-primary-1)" />
                ) : competitionNames.length > 0 ? (
                  <Box bg="red.900/20" border="1px solid" borderColor="red.600/40" rounded="lg" px={4} py={3} w="100%">
                    <Text color="red.300" fontSize="sm" fontWeight="bold" mb={1}>
                      ⚠ This will also remove you from:
                    </Text>
                    {competitionNames.map((name) => (
                      <Text key={name} color="red.200" fontSize="sm">• {name}</Text>
                    ))}
                    <Text color="red.300" fontSize="xs" mt={2}>
                      You will lose your team membership and competition registrations.
                    </Text>
                  </Box>
                ) : (
                  <Text color="neutral-3" fontSize="sm">
                    Your ticket will be removed.
                  </Text>
                )}
                <Flex gap={3} w="100%">
                  <Button
                    flex={1}
                    bg="transparent"
                    color="neutral-2"
                    borderWidth="2px"
                    borderColor="primary-3"
                    _hover={{ bg: "primary-4" }}
                    borderRadius="8px"
                    fontWeight="bold"
                    onClick={() => setShowUnregisterDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    flex={1}
                    bg="red.600"
                    color="white"
                    _hover={{ bg: "red.700" }}
                    borderRadius="8px"
                    fontWeight="bold"
                    loading={isRegistering}
                    onClick={handleConfirmUnregister}
                  >
                    <FiUserMinus />
                    Unregister
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </PageWrapper>
  );
}
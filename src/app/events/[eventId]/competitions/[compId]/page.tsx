"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import { Box, Button, Flex, Text, Image, Portal } from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react";
import { MoonLoader } from "react-spinners";
import SectionDescription from "@/components/ui/internal/section-description";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import PrizesSection from "@/components/ui/internal/events/mutex/prizes-section";
import { toaster } from "@/components/ui/toaster";
import {
  getCompetitions,
  registerForCompetition,
  unregisterFromCompetition,
  ensureEventRegistration,
  checkEventRegistration,
  checkCompetitionRegistration,
} from "@/api/competitions";
import { useWindowType } from "@/hooks/use-window-type";
import { useAuth } from "@/atoms/auth";
import { FiUserPlus, FiUserMinus, FiAlertTriangle, FiUsers } from "react-icons/fi";
import { Icon } from "@iconify/react";
import RegistrationDialog from "@/components/ui/internal/events/mutex/registration-dialog";
import CreateTeamContent from "@/components/ui/internal/events/mutex/create-team-content";
import JoinTeamContent from "@/components/ui/internal/events/mutex/join-team-content";
import { leaveTeam, removeMember } from "@/api/team";
import { QRCodeSVG } from "qrcode.react";
import { useCompetition } from "@/hooks/use-competitions";
import { useCompetitionRegistration } from "@/hooks/use-competitions";
import { useEvent, useEventImages } from "@/hooks/use-event";
import { useEventRegistration } from "@/hooks/use-event-registration";
import { useMyTeam } from "@/hooks/use-team";
import Breadcrumb from "@/components/ui/internal/breadcrumb";

export default function CompetitionPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const compId = params?.compId as string;
  const { isMobile } = useWindowType();
  const userData = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = compId ? parseInt(compId, 10) : undefined;
  const validCompId = competitionId && !isNaN(competitionId) ? competitionId : undefined;

  // --- SWR DATA FETCHING ---
  const { data: competition, isLoading: loadingComp, error: compError } = useCompetition(validCompId);
  const { data: eventData } = useEvent(eventId);
  const { data: eventImages } = useEventImages(eventId);
  const { data: compRegStatus, isLoading: checkingRegistration, mutate: mutateCompReg } = useCompetitionRegistration(validCompId, userData?.id);
  const { data: eventRegStatus } = useEventRegistration(eventData?.slug || eventId, userData?.id);

  const isRegistered = compRegStatus?.registered ?? false;
  const existingTeamId = compRegStatus?.team_id ?? null;
  const isEventRegistered = eventRegStatus?.registered ?? false;
  const eventRole = eventRegStatus?.role ?? null;
  const eventSlug = eventData?.slug || eventId || "";

  const isTeamComp = competition?.type === "team";
  const { data: teamData, isLoading: loadingTeam, mutate: mutateTeam } = useMyTeam(
    validCompId,
    isRegistered && isTeamComp
  );

  const loading = loadingComp;
  const error = compError ? "Failed to load competition details." : (!validCompId && compId ? "Invalid competition ID" : null);

  // --- UI STATES ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredOtherCompetition, setRegisteredOtherCompetition] = useState<{ name: string; id: number } | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "join" | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [leavingTeam, setLeavingTeam] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  const isTeamLeader = teamData && userData?.id
    ? String(teamData.leader_event_participant?.user?.id) === String(userData.id)
    : false;

  // Check if user is registered for another competition in same event
  useEffect(() => {
    if (!competition || !userData?.id) return;
    let cancelled = false;
    getCompetitions()
      .then((allComps) => {
        if (cancelled) return;
        const sameEventComps = allComps.filter(
          (c) => c.event_id === competition.event_id && c.id !== competition.id
        );
        return Promise.all(
          sameEventComps.map(async (c) => {
            const status = await checkCompetitionRegistration(c.id);
            return status.registered ? { name: c.name, id: c.id } : null;
          })
        );
      })
      .then((results) => {
        if (cancelled || !results) return;
        const other = results.find((r) => r !== null);
        if (other) setRegisteredOtherCompetition(other);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [competition?.id, userData?.id]);

  // Show a nudge toast when returning from login with action=register
  useEffect(() => {
    if (searchParams.get("action") === "register") {
      toaster.create({
        title: "You're logged in!",
        description: "Now click 'Join' to join this competition.",
        type: "info",
        duration: 6000,
      });
      router.replace(`/events/${eventId}/competitions/${compId}`);
    }
  }, []);

  // --- REGISTRATION LOGIC ---
  const handleRegisterToggle = async () => {
    if (!userData?.id) {
      toaster.create({
        title: "Login required",
        description: "You'll be redirected to login. After signing in, come back here to register for this competition.",
        type: "warning",
        duration: 4000,
      });
      setTimeout(() => {
        const redirectUrl = `/events/${eventId}/competitions/${compId}?action=register`;
        router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      }, 1500);
      return;
    }
    if (isRegistering) return;
    if (!competition || !eventSlug) return;
    setIsRegistering(true);

    if (isRegistered) {
      // --- UNREGISTER FROM COMPETITION ---
      try {
        await unregisterFromCompetition(competition.id);
        mutateCompReg({ registered: false }, false);
        toaster.create({ title: "Unregistered from competition", type: "info", duration: 3000 });
      } catch (err: any) {
        console.error("Unregister error:", err);
        const status = err.response?.status;
        const message = err.response?.data?.message;
        if (status === 401) {
          toaster.create({ title: "Authentication required", description: "Please log in first.", type: "warning" });
        } else if (status === 404) {
          // Not registered anyway — sync state
          mutateCompReg({ registered: false }, false);
        } else {
          toaster.create({ title: "Failed to unregister", description: message || "Please try again later.", type: "error" });
        }
      }
    } else {
      // --- REGISTER FOR COMPETITION (two-step) ---
      try {
        // Step 1: Check if already registered for the parent event
        const eventStatus = await checkEventRegistration(eventSlug);
        if (!eventStatus.registered) {
          // Not registered yet — register as spectator (backend may upgrade to competitor)
          await ensureEventRegistration(eventSlug);
        }

        // Step 2: Register for the competition (no body needed)
        await registerForCompetition(competition.id);
        mutateCompReg({ registered: true }, false);
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
            mutateCompReg({ registered: true }, false);
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
          <MoonLoader size={50} color="var(--chakra-colors-primary-1)" />
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
    (eventImages && eventImages.length > 0 && eventImages[0].url)
      ? eventImages[0].url
      : (eventData?.cover_image || eventData?.logo || eventData?.image || `/events/${eventSlug}/${eventSlug}.webp`);

  return (
    <PageWrapper>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: eventData?.name || "Event", href: `/events/${eventId}` },
          { label: competition.name },
        ]}
      />
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
            w={isMobile ? "full" : "clamp(400px, 35vw, 550px)"}
            h={isMobile ? "260px" : "auto"}
            mx={isMobile ? "auto" : "0"}
            flexShrink={0}
          >
            <Image
              src={eventImage}
              alt={competition.name}
              w="100%"
              h={isMobile ? "100%" : "auto"}
              objectFit={isMobile ? "cover" : undefined}
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
            {!isRegistered && (
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
            )}
            <Flex gap={4} flexWrap="wrap" flexDir="column">
              {competition.type === "team" ? (
                checkingRegistration ? (
                  <MoonLoader size={24} color="var(--chakra-colors-primary-1)" />
                ) : !userData?.id ? (
                  <Button
                    bg="primary-1"
                    color="white"
                    borderWidth="2px"
                    borderColor="transparent"
                    _hover={{ bg: "primary-2", borderColor: "transparent" }}
                    px="25px"
                    py="8px"
                    borderRadius="10px"
                    fontWeight="bold"
                    fontSize="18px"
                    transition="all 0.2s ease"
                    onClick={() => {
                      toaster.create({ title: "Login required", description: "You'll be redirected to login. After signing in, come back here to register.", type: "warning", duration: 4000 });
                      setTimeout(() => router.push(`/auth/login?redirect=${encodeURIComponent(`/events/${eventId}/competitions/${compId}?action=register`)}`), 1500);
                    }}
                  >
                    <FiUserPlus />
                    Login to Register
                  </Button>
                ) : registeredOtherCompetition ? (
                  <Flex
                    align="center"
                    gap={2}
                    bg={{ _light: "orange.100", _dark: "orange.950" }}
                    border="1px solid"
                    borderColor={{ _light: "orange.300", _dark: "orange.700" }}
                    rounded="lg"
                    px={4}
                    py={3}
                  >
                    <FiAlertTriangle color="orange" />
                    <Text color={{ _light: "orange.700", _dark: "orange.300" }} fontSize="sm">
                      You&apos;re already registered for{" "}
                      <Link href={`/events/${eventSlug}/competitions/${registeredOtherCompetition.id}`} style={{ fontWeight: "bold", textDecoration: "underline" }}>
                        {registeredOtherCompetition.name}
                      </Link>
                      . Unregister from it first to join a team competition.
                    </Text>
                  </Flex>
                ) : (isEventRegistered && eventRole === "spectator" && !isRegistered) ? (
                  <Flex
                    align="center"
                    gap={2}
                    bg={{ _light: "blue.100", _dark: "blue.950" }}
                    border="1px solid"
                    borderColor={{ _light: "blue.300", _dark: "blue.700" }}
                    rounded="lg"
                    px={4}
                    py={3}
                  >
                    <Icon icon="mdi:eye-outline" width={18} color="var(--chakra-colors-blue-300)" />
                    <Text color={{ _light: "blue.700", _dark: "blue.300" }} fontSize="sm">
                      You&apos;re registered as a spectator for this event. To compete, unregister from the event page first.
                    </Text>
                  </Flex>
                ) : isRegistered ? (
                  <Box
                    bg="primary-5"
                    border="1px solid"
                    borderColor="primary-3"
                    rounded="xl"
                    px={6}
                    py={5}
                    w="100%"
                    maxW="720px"
                  >
                    {loadingTeam ? (
                      <Flex justify="center" py={4}>
                        <MoonLoader size={24} color="var(--chakra-colors-primary-1)" />
                      </Flex>
                    ) : teamData ? (
                      <Flex
                        gap={6}
                        flexDir={isMobile ? "column" : "row"}
                        w="100%"
                      >
                        {/* LEFT SIDE: Team info + Members */}
                        <Flex flexDir="column" gap={3} flex={1} minW={0}>
                          <Flex align="center" justify="space-between">
                            <Flex align="center" gap={2}>
                              <Icon icon="mdi:account-group" width={22} color="var(--chakra-colors-primary-1)" />
                              <Text color="neutral-1" fontWeight="bold" fontSize="md">
                                {teamData.name}
                              </Text>
                            </Flex>
                            <Text color="rgba(255,255,255,0.5)" fontSize="xs" bg="primary-4" px={2.5} py={0.5} rounded="full" ml={2}>
                              {teamData.members.length}/{competition.max_team_members}
                            </Text>
                          </Flex>

                          <Flex flexDir="column" gap={1} bg="primary-4" rounded="lg" px={3} py={2}>
                            {teamData.members.map((m) => (
                              <Flex key={m.id} align="center" gap={2} py={1} justify="space-between">
                                <Flex align="center" gap={2}>
                                  <Icon icon="mdi:account" width={16} color="rgba(255,255,255,0.5)" />
                                  <Text color="rgba(255,255,255,0.8)" fontSize="sm">{m.event_participant.user.name}</Text>
                                  {m.event_participant_id === teamData.leader_event_participant_id && (
                                    <Text color="primary-1" fontSize="xs" fontWeight="bold">Leader</Text>
                                  )}
                                </Flex>
                                {isTeamLeader && m.event_participant_id !== teamData.leader_event_participant_id && (
                                  <Button
                                    size="xs"
                                    bg="transparent"
                                    color="red.400"
                                    _hover={{ bg: "red.600", color: "white" }}
                                    p={1}
                                    minW="auto"
                                    borderRadius="full"
                                    loading={removingMemberId === m.id}
                                    onClick={async () => {
                                      if (removingMemberId !== null) return;
                                      setRemovingMemberId(m.id);
                                      try {
                                        const joinCode = m.event_participant.user.join_code;
                                        if (!joinCode) {
                                          toaster.create({ title: "Cannot remove member", description: "This member cannot be removed right now. Please try again later.", type: "error" });
                                          setRemovingMemberId(null);
                                          return;
                                        }
                                        await removeMember(competition.id, joinCode);
                                        mutateTeam();
                                        toaster.create({ title: `Removed ${m.event_participant.user.name}`, type: "info", duration: 3000 });
                                      } catch (err: any) {
                                        toaster.create({ title: "Failed to remove member", description: err.response?.data?.message || "Please try again.", type: "error" });
                                      }
                                      setRemovingMemberId(null);
                                    }}
                                  >
                                    <Icon icon="mdi:close" width={14} />
                                  </Button>
                                )}
                              </Flex>
                            ))}
                          </Flex>

                          {isTeamLeader && (
                            <Flex gap={2} mt={1}>
                              <Button
                                bg="primary-1"
                                color="white"
                                borderWidth="2px"
                                borderColor="transparent"
                                _hover={{ bg: "primary-2", borderColor: "transparent" }}
                                px="16px"
                                py="6px"
                                borderRadius="8px"
                                fontWeight="medium"
                                fontSize="14px"
                                transition="all 0.2s ease"
                                flex={1}
                                onClick={() => setDialogMode("create")}
                              >
                                <FiUserPlus />
                                Invite Members
                              </Button>
                              <Button
                                bg="transparent"
                                color="red.400"
                                borderWidth="2px"
                                borderColor="red.400"
                                _hover={{ bg: "red.600", color: "white", borderColor: "red.600" }}
                                px="16px"
                                py="6px"
                                borderRadius="8px"
                                fontWeight="medium"
                                fontSize="14px"
                                transition="all 0.2s ease"
                                onClick={() => setShowLeaveConfirm(true)}
                              >
                                <FiUserMinus />
                                Leave
                              </Button>
                            </Flex>
                          )}
                        </Flex>

                        {/* DIVIDER */}
                        <Box
                          display={isMobile ? "none" : "block"}
                          w="1px"
                          bg="primary-3"
                          alignSelf="stretch"
                        />

                        {/* RIGHT SIDE */}
                        {isTeamLeader ? (<>

                        {/* RIGHT SIDE: Team Code + QR button */}
                        <Flex
                          flexDir="column"
                          align="center"
                          justify="center"
                          gap={3}
                          minW={isMobile ? "auto" : "200px"}
                          py={2}
                        >
                          <Text color="neutral-3" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                            Share Invite
                          </Text>
                          <Flex
                            align="center"
                            gap={2}
                            bg="primary-4"
                            border="1px solid"
                            borderColor="primary-3"
                            rounded="lg"
                            px={3}
                            py={2}
                          >
                            <Text color="white" fontSize="md" fontFamily="mono" fontWeight="bold" letterSpacing="widest">
                              {teamData.join_code}
                            </Text>
                            <Button
                              size="xs"
                              bg="transparent"
                              color="rgba(255,255,255,0.8)"
                              _hover={{ bg: "rgba(255,255,255,0.2)", color: "primary-1" }}
                              p={1}
                              minW="auto"
                              borderRadius="full"
                              onClick={() => {
                                navigator.clipboard.writeText(teamData.join_code).catch(() => {});
                                toaster.create({ title: "Copied!", description: "Team code copied to clipboard.", type: "success", duration: 2000 });
                              }}
                            >
                              <Icon icon="mdi:content-copy" width={16} />
                            </Button>
                          </Flex>
                          <Button
                            bg="transparent"
                            color="neutral-2"
                            borderWidth="1px"
                            borderColor="primary-3"
                            _hover={{ bg: "primary-4", color: "primary-1" }}
                            px={4}
                            py={2}
                            borderRadius="lg"
                            fontSize="sm"
                            fontWeight="bold"
                            onClick={() => setShowQR(true)}
                            disabled={loadingTeam || !teamData?.join_code}
                          >
                            <Icon icon="mdi:qrcode" width={18} />
                            Show QR Code
                          </Button>
                          <Text color="neutral-3" fontSize="xs" textAlign="center">
                            Share the code or scan QR to invite teammates
                          </Text>
                        </Flex>
                        </>) : (
                        <Flex
                          flexDir="column"
                          align="center"
                          justify="center"
                          gap={3}
                          minW={isMobile ? "auto" : "180px"}
                          py={2}
                        >
                          <Text color="neutral-3" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                            Leave Team
                          </Text>
                          <Text color="neutral-3" fontSize="xs" textAlign="center" lineHeight="1.4">
                            You&apos;ll need a new invite to rejoin.
                          </Text>
                          <Button
                            bg="transparent"
                            color="red.400"
                            borderWidth="2px"
                            borderColor="red.400"
                            _hover={{ bg: "red.600", color: "white", borderColor: "red.600" }}
                            px="16px"
                            py="6px"
                            borderRadius="8px"
                            fontWeight="medium"
                            fontSize="14px"
                            transition="all 0.2s ease"
                            onClick={() => setShowLeaveConfirm(true)}
                          >
                            <FiUserMinus />
                            Leave
                          </Button>
                        </Flex>
                        )}
                      </Flex>
                    ) : (
                      <Text color="neutral-3" fontSize="sm">Could not load team info</Text>
                    )}
                  </Box>
                ) : (
                  <Flex
                    gap={3}
                    flexWrap="wrap"
                  >
                    <Button
                      bg="primary-1"
                      color="white"
                      borderWidth="2px"
                      borderColor="transparent"
                      _hover={{ bg: "primary-2", borderColor: "transparent" }}
                      px="25px"
                      py="8px"
                      borderRadius="10px"
                      fontWeight="bold"
                      fontSize="18px"
                      transition="all 0.2s ease"
                      onClick={() => setDialogMode("create")}
                    >
                      <FiUsers />
                      Create a Team
                    </Button>
                    <Button
                      bg="primary-1"
                      color="white"
                      borderWidth="2px"
                      borderColor="transparent"
                      _hover={{ bg: "primary-2", borderColor: "transparent" }}
                      px="25px"
                      py="8px"
                      borderRadius="10px"
                      fontWeight="bold"
                      fontSize="18px"
                      transition="all 0.2s ease"
                      onClick={() => setDialogMode("join")}
                    >
                      <FiUserPlus />
                      Join a Team
                    </Button>
                  </Flex>
                )
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
                  {isRegistered ? "Unregister" : "Join Competition!"}
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
        {competition.type === "team" && !registeredOtherCompetition && (
          <SectionContainer>
            <SectionDescription description={!userData?.id ? "Login to register your team!" : isRegistered && existingTeamId && isTeamLeader ? "Invite more members to your team!" : isRegistered && existingTeamId ? "You're part of a team! Good luck!" : isRegistered ? "Create or join a team to compete!" : "Ready to compete? Register your team now!"} />
            {checkingRegistration ? (
              <MoonLoader size={24} color="var(--chakra-colors-primary-1)" />
            ) : !userData?.id ? (
              <Button
                bg="primary-1"
                color="white"
                borderWidth="2px"
                borderColor="transparent"
                _hover={{ bg: "primary-2", borderColor: "transparent" }}
                px="25px"
                py="8px"
                borderRadius="10px"
                fontWeight="bold"
                fontSize="18px"
                transition="all 0.2s ease"
                onClick={() => {
                  toaster.create({ title: "Login required", description: "You'll be redirected to login. After signing in, come back here to register.", type: "warning", duration: 4000 });
                  setTimeout(() => router.push(`/auth/login?redirect=${encodeURIComponent(`/events/${eventId}/competitions/${compId}?action=register`)}`), 1500);
                }}
              >
                <FiUserPlus />
                Login to Register
              </Button>
            ) : isRegistered && existingTeamId && isTeamLeader ? (
            <Button
              bg="primary-1"
              color="white"
              borderWidth="2px"
              borderColor="transparent"
              _hover={{ bg: "primary-2", borderColor: "transparent" }}
              px="25px"
              py="8px"
              borderRadius="10px"
              fontWeight="bold"
              fontSize="18px"
              transition="all 0.2s ease"
              onClick={() => setDialogMode("create")}
            >
              <FiUserPlus />
              Invite Members
            </Button>
            ) : isRegistered && existingTeamId ? (
              <Text color="neutral-2" fontSize="md">You&apos;re part of a team!</Text>
            ) : isRegistered && !existingTeamId ? (
            <Flex gap={3} flexWrap="wrap" justify="center">
              <Button
                bg="primary-1"
                color="white"
                borderWidth="2px"
                borderColor="transparent"
                _hover={{ bg: "primary-2", borderColor: "transparent" }}
                px="25px"
                py="8px"
                borderRadius="10px"
                fontWeight="bold"
                fontSize="18px"
                transition="all 0.2s ease"
                onClick={() => setDialogMode("create")}
              >
                <FiUsers />
                Create a Team
              </Button>
              <Button
                bg="primary-1"
                color="white"
                borderWidth="2px"
                borderColor="transparent"
                _hover={{ bg: "primary-2", borderColor: "transparent" }}
                px="25px"
                py="8px"
                borderRadius="10px"
                fontWeight="bold"
                fontSize="18px"
                transition="all 0.2s ease"
                onClick={() => setDialogMode("join")}
              >
                <FiUserPlus />
                Join a Team
              </Button>
            </Flex>
            ) : (
            <Flex
              gap={3}
              flexWrap="wrap"
              justify="center"
            >
              <Button
                bg="primary-1"
                color="white"
                borderWidth="2px"
                borderColor="transparent"
                _hover={{ bg: "primary-2", borderColor: "transparent" }}
                px="25px"
                py="8px"
                borderRadius="10px"
                fontWeight="bold"
                fontSize="18px"
                transition="all 0.2s ease"
                onClick={() => setDialogMode("create")}
              >
                <FiUsers />
                Create a Team
              </Button>
              <Button
                bg="primary-1"
                color="white"
                borderWidth="2px"
                borderColor="transparent"
                _hover={{ bg: "primary-2", borderColor: "transparent" }}
                px="25px"
                py="8px"
                borderRadius="10px"
                fontWeight="bold"
                fontSize="18px"
                transition="all 0.2s ease"
                onClick={() => setDialogMode("join")}
              >
                <FiUserPlus />
                Join a Team
              </Button>
            </Flex>
            )}
          </SectionContainer>
        )}
        {competition.type !== "team" && (
          <SectionContainer>
            <SectionDescription description={isRegistered ? "You are registered for this competition!" : "What are you waiting for? Get Ticket!"} />
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
              {isRegistered ? "Unregister" : "Join Competition!"}
            </Button>
          </SectionContainer>
        )}
      </Flex>

      {/* Registration Dialogs */}
      <RegistrationDialog
        open={dialogMode === "create"}
        onClose={() => setDialogMode(null)}
        title={existingTeamId ? `Invite Members to ${competition.name}` : `Create a Team in ${competition.name}`}
      >
        <CreateTeamContent
          key={dialogMode === "create" ? "open" : "closed"}
          competitionId={competition.id}
          eventSlug={eventSlug}
          maxTeamMembers={competition.max_team_members}
          existingTeamId={existingTeamId}
          onDone={() => {
            setDialogMode(null);
            mutateCompReg();
            mutateTeam();
          }}
        />
      </RegistrationDialog>

      <RegistrationDialog
        open={dialogMode === "join"}
        onClose={() => setDialogMode(null)}
        title={`Join a Team in ${competition.name}`}
      >
        <JoinTeamContent
          competitionId={competition.id}
          eventSlug={eventSlug}
          onDone={() => setDialogMode(null)}
          onTeamJoined={() => {
            mutateCompReg();
            mutateTeam();
          }}
        />
      </RegistrationDialog>

      {/* QR Code Dialog */}
      <Dialog.Root
        open={showQR}
        onOpenChange={(e) => { if (!e.open) setShowQR(false); }}
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
                <Dialog.Title fontSize="lg" fontWeight="bold" color="neutral-1">
                  Team Invite QR Code
                </Dialog.Title>
                <Box bg="white" p={4} rounded="xl">
                  {teamData?.join_code && <QRCodeSVG value={teamData.join_code} size={180} />}
                </Box>
                <Text color="neutral-3" fontSize="sm">
                  Scan this code to join <strong>{teamData?.name}</strong>
                </Text>
                <Flex
                  align="center"
                  gap={2}
                  bg="primary-4"
                  border="1px solid"
                  borderColor="primary-3"
                  rounded="lg"
                  px={4}
                  py={2}
                >
                  <Text color="white" fontSize="lg" fontFamily="mono" fontWeight="bold" letterSpacing="widest">
                    {teamData?.join_code}
                  </Text>
                  <Button
                    size="xs"
                    bg="transparent"
                    color="rgba(255,255,255,0.8)"
                    _hover={{ bg: "rgba(255,255,255,0.2)", color: "primary-1" }}
                    p={1}
                    minW="auto"
                    borderRadius="full"
                    onClick={() => {
                      navigator.clipboard.writeText(teamData?.join_code || "").catch(() => {});
                      toaster.create({ title: "Copied!", description: "Team code copied to clipboard.", type: "success", duration: 2000 });
                    }}
                  >
                    <Icon icon="mdi:content-copy" width={18} />
                  </Button>
                </Flex>
                <Button
                  bg="primary-1"
                  color="white"
                  _hover={{ bg: "primary-2" }}
                  borderRadius="8px"
                  fontWeight="bold"
                  w="100%"
                  onClick={() => setShowQR(false)}
                >
                  Close
                </Button>
              </Flex>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Leave Team Confirmation Dialog */}
      <Dialog.Root
        open={showLeaveConfirm}
        onOpenChange={(e) => { if (!e.open) setShowLeaveConfirm(false); }}
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
                  Leave Team?
                </Dialog.Title>
                <Text color="neutral-3" fontSize="sm">
                  Are you sure you want to leave <strong>{teamData?.name}</strong>?{isTeamLeader ? " As the leader, your team may be disbanded." : ""} This action cannot be undone.
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
                    onClick={() => setShowLeaveConfirm(false)}
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
                    loading={leavingTeam}
                    onClick={async () => {
                      setLeavingTeam(true);
                      try {
                        await leaveTeam(competition.id);
                        mutateCompReg({ registered: false }, false);
                        mutateTeam(undefined, false);
                        setShowLeaveConfirm(false);
                        toaster.create({ title: "Left team", type: "info", duration: 3000 });
                      } catch (err: any) {
                        toaster.create({ title: "Failed to leave team", description: err.response?.data?.message || "Please try again.", type: "error" });
                      }
                      setLeavingTeam(false);
                    }}
                  >
                    <FiUserMinus />
                    Leave Team
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

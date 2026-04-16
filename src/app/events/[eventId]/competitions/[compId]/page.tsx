"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  getCompetitionById,
  getCompetitions,
  registerForCompetition,
  unregisterFromCompetition,
  ensureEventRegistration,
  checkCompetitionRegistration,
  checkEventRegistration,
  type ApiCompetition,
} from "@/api/competitions";
import { getEventById, type ApiEvent } from "@/api/events";
import { useWindowType } from "@/hooks/use-window-type";
import { useAuth } from "@/atoms/auth";
import { FiUserPlus, FiUserMinus, FiAlertTriangle, FiUsers } from "react-icons/fi";
import { Icon } from "@iconify/react";
import RegistrationDialog from "@/components/ui/internal/events/mutex/registration-dialog";
import CreateTeamContent from "@/components/ui/internal/events/mutex/create-team-content";
import JoinTeamContent from "@/components/ui/internal/events/mutex/join-team-content";
import { getMyTeam, leaveTeam, removeMember, type ApiTeam } from "@/api/team";
import { QRCodeSVG } from "qrcode.react";

export default function CompetitionPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const compId = params?.compId as string;
  const { isMobile } = useWindowType();
  const userData = useAuth();

  const [competition, setCompetition] = useState<ApiCompetition | null>(null);
  const [eventData, setEventData] = useState<ApiEvent | null>(null);
  const [eventSlug, setEventSlug] = useState<string>(eventId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- REGISTRATION STATES ---
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [existingTeamId, setExistingTeamId] = useState<number | null>(null);
  const [registeredOtherCompetition, setRegisteredOtherCompetition] = useState<{ name: string; id: number } | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "join" | null>(null);
  const [teamData, setTeamData] = useState<ApiTeam | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [leavingTeam, setLeavingTeam] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [isEventRegistered, setIsEventRegistered] = useState(false);
  const [eventRole, setEventRole] = useState<string | null>(null);

  const isTeamLeader = teamData && userData?.id
    ? String(teamData.leader_event_participant?.user?.id) === String(userData.id)
    : false;
  useEffect(() => {
    if (!compId) return;
    const competitionId = parseInt(compId, 10);
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
        // Use eventId from URL directly as the slug
        setEventSlug(eventId);
        getEventById(eventId)
          .then((ev) => { if (!cancelled && ev) setEventData(ev); })
          .catch((err) => console.warn("Failed to load event:", err));

        // Check if user is already registered for this competition
        if (userData?.id) {
          checkCompetitionRegistration(competitionId)
            .then((status) => {
              if (!cancelled) {
                setIsRegistered(status.registered);
                if (status.team_id) setExistingTeamId(status.team_id);
              }
            })
            .catch((err) => { console.warn("Registration check failed:", err); })
            .finally(() => { if (!cancelled) setCheckingRegistration(false); });

          // For team competitions, check if user is registered for another competition in this event
          if (comp.type === "team") {
            // Also check event registration status
            checkEventRegistration(eventId)
              .then((status) => {
                if (!cancelled) {
                  setIsEventRegistered(status.registered);
                  setEventRole(status.role || null);
                }
              })
              .catch(() => {});

            getCompetitions()
              .then((allComps) => {
                if (cancelled) return;
                const sameEventComps = allComps.filter(
                  (c) => c.event_id === comp.event_id && c.id !== comp.id
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
              .catch((err) => { console.warn("Cross-registration check failed:", err); });
          }
        } else {
          if (!cancelled) setCheckingRegistration(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load competition details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [compId, eventId, userData?.id]);

  // Fetch team data when user is registered for a team competition
  useEffect(() => {
    if (!isRegistered || !competition || competition.type !== "team") return;
    let cancelled = false;
    setLoadingTeam(true);
    getMyTeam(competition.id)
      .then((team) => {
        if (cancelled) return;
        setTeamData(team);
        setExistingTeamId(team.id);
      })
      .catch((err) => { console.warn("Failed to load team:", err); })
      .finally(() => { if (!cancelled) setLoadingTeam(false); });
    return () => { cancelled = true; };
  }, [isRegistered, competition?.id]);

  // --- REGISTRATION LOGIC ---
  const handleRegisterToggle = async () => {
    if (!userData?.id) {
      toaster.create({ title: "Authentication required", description: "Please log in to register.", type: "warning" });
      return;
    }
    if (isRegistering) return;
    if (!competition || !eventSlug) return;
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
        // Step 1: Check if already registered for the parent event
        const eventStatus = await checkEventRegistration(eventSlug);
        if (!eventStatus.registered) {
          // Not registered yet — register as spectator (backend may upgrade to competitor)
          await ensureEventRegistration(eventSlug);
        }

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
    `/events/${eventSlug}/${eventSlug}.webp`;

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
                  <Link href="/auth/login">
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
                    >
                      <FiUserPlus />
                      Login to Register
                    </Button>
                  </Link>
                ) : registeredOtherCompetition ? (
                  <Flex
                    align="center"
                    gap={2}
                    bg="orange.950"
                    border="1px solid"
                    borderColor="orange.700"
                    rounded="lg"
                    px={4}
                    py={3}
                  >
                    <FiAlertTriangle color="orange" />
                    <Text color="orange.300" fontSize="sm">
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
                    bg="blue.950"
                    border="1px solid"
                    borderColor="blue.700"
                    rounded="lg"
                    px={4}
                    py={3}
                  >
                    <Icon icon="mdi:eye-outline" width={18} color="var(--chakra-colors-blue-300)" />
                    <Text color="blue.300" fontSize="sm">
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
                            <Text color="neutral-3" fontSize="xs" bg="primary-4" px={2} py={0.5} rounded="full">
                              {teamData.members.length}/{competition.max_team_members}
                            </Text>
                          </Flex>

                          <Flex flexDir="column" gap={1} bg="primary-4" rounded="lg" px={3} py={2}>
                            {teamData.members.map((m) => (
                              <Flex key={m.id} align="center" gap={2} py={1} justify="space-between">
                                <Flex align="center" gap={2}>
                                  <Icon icon="mdi:account" width={16} color="var(--chakra-colors-neutral-3)" />
                                  <Text color="neutral-2" fontSize="sm">{m.event_participant.user.name}</Text>
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
                                        setTeamData((prev) => prev ? {
                                          ...prev,
                                          members: prev.members.filter((mem) => mem.id !== m.id),
                                        } : null);
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
                              fontWeight="bold"
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
                              fontWeight="bold"
                              fontSize="14px"
                              transition="all 0.2s ease"
                              onClick={() => setShowLeaveConfirm(true)}
                            >
                              <FiUserMinus />
                              Leave
                            </Button>
                          </Flex>
                        </Flex>

                        {/* DIVIDER */}
                        <Box
                          display={isMobile ? "none" : "block"}
                          w="1px"
                          bg="primary-3"
                          alignSelf="stretch"
                        />

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
                            <Text color="neutral-1" fontSize="md" fontFamily="mono" fontWeight="bold" letterSpacing="widest">
                              {teamData.join_code}
                            </Text>
                            <Button
                              size="xs"
                              bg="transparent"
                              color="neutral-2"
                              _hover={{ bg: "rgba(255,255,255,0.05)", color: "primary-1" }}
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
                          >
                            <Icon icon="mdi:qrcode" width={18} />
                            Show QR Code
                          </Button>
                          <Text color="neutral-3" fontSize="xs" textAlign="center">
                            Share the code or scan QR to invite teammates
                          </Text>
                        </Flex>
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
        {competition.type === "team" && !registeredOtherCompetition && (
          <SectionContainer>
            <SectionDescription description={!userData?.id ? "Login to register your team!" : isRegistered ? "Invite more members to your team!" : "Ready to compete? Register your team now!"} />
            {checkingRegistration ? (
              <MoonLoader size={24} color="var(--chakra-colors-primary-1)" />
            ) : !userData?.id ? (
              <Link href="/auth/login">
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
                >
                  <FiUserPlus />
                  Login to Register
                </Button>
              </Link>
            ) : isRegistered ? (
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
            setIsRegistered(true);
            // Refresh team data
            getMyTeam(competition.id)
              .then((team) => {
                setTeamData(team);
                setExistingTeamId(team.id);
              })
              .catch((err) => { console.warn("Failed to refresh team:", err); });
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
            setIsRegistered(true);
            // Refresh team data
            getMyTeam(competition.id)
              .then((team) => {
                setTeamData(team);
                setExistingTeamId(team.id);
              })
              .catch((err) => { console.warn("Failed to refresh team after join:", err); });
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
              borderColor="#005481"
              borderRadius="10px"
              color="neutral-1"
              p={6}
            >
              <Flex flexDir="column" gap={4} align="center" textAlign="center">
                <Dialog.Title fontSize="lg" fontWeight="bold" color="neutral-1">
                  Team Invite QR Code
                </Dialog.Title>
                <Box bg="white" p={4} rounded="xl">
                  <QRCodeSVG value={teamData?.join_code || ""} size={180} />
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
                  <Text color="neutral-1" fontSize="lg" fontFamily="mono" fontWeight="bold" letterSpacing="widest">
                    {teamData?.join_code}
                  </Text>
                  <Button
                    size="xs"
                    bg="transparent"
                    color="neutral-2"
                    _hover={{ bg: "rgba(255,255,255,0.05)", color: "primary-1" }}
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
              borderColor="#005481"
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
                        setIsRegistered(false);
                        setExistingTeamId(null);
                        setTeamData(null);
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

"use client";

import { useState, useEffect } from "react";
import {
  VStack,
  Flex,
  Text,
  HStack,
  Button,
  Box,
  Input as ChakraInput,
} from "@chakra-ui/react";
import CustomButton from "@/components/ui/internal/events/mutex/registration/custom-button";
import { toaster } from "@/components/ui/toaster";
import { createTeam, addMember, removeMember, getMyTeam, type ApiTeamMember } from "@/api/team";
import { ensureEventRegistration, checkEventRegistration } from "@/api/competitions";
import { Icon } from "@iconify/react";
import { QRCodeSVG } from "qrcode.react";
import QrScannerDialog from "@/components/ui/internal/events/mutex/qr-scanner-dialog";

interface MemberEntry {
  joinCode: string;
  name: string;
  status: "pending" | "added";
  teamMember?: ApiTeamMember;
}

interface Props {
  competitionId: number;
  eventSlug: string;
  maxTeamMembers: number;
  existingTeamId?: number | null;
  onDone: () => void;
}

export default function CreateTeamContent({ competitionId, eventSlug, maxTeamMembers, existingTeamId, onDone }: Props) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState<number | null>(existingTeamId ?? null);
  const [created, setCreated] = useState(!!existingTeamId);
  const [userJoinCode, setUserJoinCode] = useState("");
  const [teamJoinCode, setTeamJoinCode] = useState("");
  const [userName, setUserName] = useState("You");
  const [existingTeamName, setExistingTeamName] = useState("");
  const [existingMembers, setExistingMembers] = useState<{ name: string; isLeader: boolean }[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(!!existingTeamId);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user-data");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserJoinCode(parsed.inviteUserToken || "");
        setUserName(parsed.name || "You");
      }
    } catch {
      // Malformed localStorage data — use defaults
    }
  }, []);

  // Fetch existing team info when opening in invite mode
  useEffect(() => {
    if (!existingTeamId) return;
    setLoadingTeam(true);
    getMyTeam(competitionId)
      .then((team) => {
        setExistingTeamName(team.name);
        setTeamJoinCode(team.join_code);
        const memberList = team.members.map((m) => ({
          name: m.event_participant.user.name,
          isLeader: m.event_participant_id === team.leader_event_participant_id,
        }));
        // Put leader first
        memberList.sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));
        setExistingMembers(memberList);
      })
      .catch(() => {
        toaster.error({ closable: true, title: "Failed to load team info", duration: 3000 });
      })
      .finally(() => setLoadingTeam(false));
  }, [existingTeamId, competitionId]);

  const totalMembers = 1 + members.length; // creator + added members

  async function handleCreateTeam() {
    if (loading) return;
    if (!teamName.trim()) {
      toaster.error({ closable: true, title: "Missing team name", duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      // Ensure event registration (team creation handles competition registration)
      const eventStatus = await checkEventRegistration(eventSlug);
      if (!eventStatus.registered) {
        await ensureEventRegistration(eventSlug);
      }
      const team = await createTeam(competitionId, teamName);
      setCreatedTeamId(team.id);
      setTeamJoinCode(team.join_code);

      // Process any pending members that were queued before creation
      const pendingMembers = members.filter((m) => m.status === "pending");
      for (const member of pendingMembers) {
        try {
          const tm = await addMember(competitionId, member.joinCode);
          const memberName = tm.event_participant?.user?.name ?? member.joinCode;
          setMembers((prev) =>
            prev.map((m) =>
              m.joinCode === member.joinCode
                ? { ...m, name: memberName, status: "added" as const, teamMember: tm }
                : m
            )
          );
        } catch {
          // Mark as failed so user knows to retry
          setMembers((prev) =>
            prev.map((m) =>
              m.joinCode === member.joinCode
                ? { ...m, status: "pending" as const }
                : m
            )
          );
          toaster.create({ closable: true, title: `Failed to add ${member.joinCode}`, description: "You can retry from the invite section.", type: "warning", duration: 4000 });
        }
      }

      setCreated(true);
      toaster.success({
        closable: true,
        title: "Team Created",
        description: "Your team has been successfully created.",
        duration: 5000,
      });
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Please try again later.";
      if (status === 409) {
        // Already registered or already in a team — fetch existing team data
        try {
          const existingTeam = await getMyTeam(competitionId);
          setCreatedTeamId(existingTeam.id);
          setTeamJoinCode(existingTeam.join_code);
          setExistingTeamName(existingTeam.name);
          const memberList = existingTeam.members.map((m) => ({
            name: m.event_participant.user.name,
            isLeader: m.event_participant_id === existingTeam.leader_event_participant_id,
          }));
          memberList.sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));
          setExistingMembers(memberList);
        } catch {
          // Could not fetch team — show generic message
        }
        setCreated(true);
        toaster.create({ closable: true, title: "Already Registered", description: message, type: "info", duration: 5000 });
      } else if (status === 403) {
        toaster.error({ closable: true, title: "Not Registered for Event", description: message || "You must register for the event before creating a team.", duration: 5000 });
      } else if (status === 422) {
        toaster.error({ closable: true, title: "Teams Not Supported", description: message || "This competition does not support teams.", duration: 5000 });
      } else {
        toaster.error({ closable: true, title: "Team Creation Failed", description: message, duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember() {
    if (!memberIdInput.trim()) return;
    if (totalMembers >= maxTeamMembers) {
      toaster.error({ closable: true, title: "Team Full", description: `Maximum ${maxTeamMembers} members allowed.`, duration: 3000 });
      return;
    }

    const trimmedId = memberIdInput.trim();

    // Prevent adding yourself
    if (trimmedId === userJoinCode) {
      toaster.error({ closable: true, title: "Can't add yourself", description: "You're already in the team as the leader.", duration: 3000 });
      return;
    }

    // Prevent duplicate
    if (members.some((m) => m.joinCode === trimmedId)) {
      toaster.error({ closable: true, title: "Already added", description: "This member is already in the list.", duration: 3000 });
      return;
    }

    if (!createdTeamId) {
      setMembers((prev) => [
        ...prev,
        { joinCode: trimmedId, name: trimmedId, status: "pending" },
      ]);
      setMemberIdInput("");
      return;
    }

    setAddingMember(true);
    try {
      const tm = await addMember(competitionId, trimmedId);
      const memberName = tm.event_participant?.user?.name ?? trimmedId;
      setMembers((prev) => [
        ...prev,
        {
          joinCode: trimmedId,
          name: memberName,
          status: "added",
          teamMember: tm,
        },
      ]);
      setMemberIdInput("");
      toaster.success({
        closable: true,
        title: "Member Added",
        description: `${memberName} has been added.`,
        duration: 3000,
      });
    } catch (err: any) {
      toaster.error({
        closable: true,
        title: "Add Failed",
        description: err.response?.data?.message || "Failed to add member.",
        duration: 5000,
      });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(index: number) {
    const member = members[index];
    if (createdTeamId && member.status === "added") {
      try {
        await removeMember(competitionId, member.joinCode);
      } catch (err: any) {
        toaster.error({
          closable: true,
          title: "Remove Failed",
          description: err.response?.data?.message || "Failed to remove member.",
          duration: 5000,
        });
        return;
      }
    }
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  if (created) {
    const displayMembers = existingTeamId ? existingMembers : [];
    const memberCount = existingTeamId
      ? existingMembers.length + members.filter((m) => !existingMembers.some((em) => em.name === m.name)).length
      : totalMembers;

    return (
      <VStack gap={5} w="100%" align="stretch">
        {existingTeamId ? (
          loadingTeam ? (
            <VStack gap={2} align="center" py={4}>
              <Text color="neutral-2" fontSize="sm">Loading team info...</Text>
            </VStack>
          ) : (
            <VStack gap={3} align="stretch">
              <Flex align="center" gap={2}>
                <Icon icon="mdi:account-group" width={24} height={24} color="var(--chakra-colors-primary-1)" />
                <Text fontWeight="bold" fontSize="lg" color="neutral-1">{existingTeamName}</Text>
              </Flex>
              <Text fontSize="sm" color="neutral-2" fontWeight="semibold">
                Members ({memberCount} of {maxTeamMembers})
              </Text>
              <VStack gap={2} align="stretch">
                {displayMembers.map((m, i) => (
                  <Flex
                    key={i}
                    align="center"
                    gap={2}
                    bg="primary-12"
                    px={3} py={2}
                    rounded="md"
                    border="1px solid"
                    borderColor="primary-3"
                  >
                    <Icon icon="mdi:account" width={18} height={18} />
                    <Text fontSize="sm" flex={1}>{m.name}</Text>
                    {m.isLeader && (
                      <Text fontSize="xs" color="primary-1" fontWeight="bold">Leader</Text>
                    )}
                  </Flex>
                ))}
              </VStack>
            </VStack>
          )
        ) : (
          <VStack gap={2} align="center">
            <Icon icon="mdi:check-circle" width={48} height={48} color="#38A169" />
            <Text fontWeight="bold" fontSize="lg">Team Created!</Text>
          </VStack>
        )}

        {!existingTeamId && (
          <Text fontSize="sm" color="neutral-2" fontWeight="semibold">
            Members ({totalMembers} of {maxTeamMembers})
          </Text>
        )}

        {/* Invite members section */}
        <Flex
          w="100%"
          border="1px solid"
          borderColor="primary-3"
          bg="primary-12"
          borderRadius="10px"
          align="center"
          px={3}
          transition="all 0.2s ease-in-out"
          _focusWithin={{ borderColor: "primary-2", boxShadow: "0 0 0 1px var(--chakra-colors-primary-4)" }}
        >
          <ChakraInput
            placeholder="Enter member ID"
            color="neutral-1"
            border="none"
            outline="none"
            _focus={{ boxShadow: "none" }}
            _placeholder={{ color: "neutral-3" }}
            fontSize="0.9rem"
            py="var(--global-spacing)"
            flex={1}
            value={memberIdInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberIdInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleAddMember()}
          />
          <Button
            bg="transparent"
            color={memberIdInput.trim() ? "primary-1" : "neutral-3"}
            _hover={{ color: "primary-2" }}
            p={1} minW="auto" h="auto"
            onClick={handleAddMember}
            loading={addingMember}
            disabled={!memberIdInput.trim()}
          >
            <Icon icon="mdi:plus" width={20} height={20} />
          </Button>
          <Button
            bg="transparent"
            color="neutral-2"
            _hover={{ color: "primary-1" }}
            p={1} minW="auto" h="auto"
            onClick={() => setShowScanner(true)}
          >
            <Icon icon="mdi:qrcode-scan" width={18} height={18} />
          </Button>
        </Flex>

        {members.length > 0 && (
          <VStack gap={2} align="stretch" w="100%">
            {members.map((m, i) => (
              <Flex
                key={i}
                justify="space-between"
                align="center"
                bg="primary-12"
                px={3} py={2}
                rounded="md"
                border="1px solid"
                borderColor="primary-3"
              >
                <Text fontSize="sm">{m.name}</Text>
                <HStack gap={2}>
                  <Text
                    fontSize="xs"
                    color={m.status === "added" ? "green.300" : "yellow.300"}
                    fontWeight="bold"
                  >
                    {m.status === "added" ? "Added" : "Pending"}
                  </Text>
                  <Button
                    size="xs"
                    bg="transparent"
                    color="red.300"
                    _hover={{ bg: "rgba(255,0,0,0.1)" }}
                    onClick={() => handleRemoveMember(i)}
                    p={1} minW="auto"
                  >
                    <Icon icon="mdi:close" width={14} height={14} />
                  </Button>
                </HStack>
              </Flex>
            ))}
          </VStack>
        )}

        {/* Share your invite info — only show after team data is loaded */}
        {!loadingTeam && teamJoinCode && (
          <VStack gap={2} align="center" pt={2}>
            <Text fontSize="sm" color="neutral-2">Share your invite info with members:</Text>
            <Box bg="white" p={2} rounded="md">
              <QRCodeSVG value={teamJoinCode} size={100} />
            </Box>
            <HStack
              gap={2}
              border="1px solid"
              borderColor="primary-3"
              rounded="lg"
              px={4} py={2}
              bg="primary-12"
            >
              <Text fontSize="sm" fontFamily="mono" fontWeight="bold">{teamJoinCode}</Text>
              <Button
                size="xs"
                color="neutral-2"
                bg="transparent"
                _hover={{ bg: "rgba(255,255,255,0.05)" }}
                onClick={() => {
                  navigator.clipboard.writeText(teamJoinCode).catch(() => {});
                  toaster.success({ closable: true, title: "Copied!", duration: 2000 });
                }}
                p={1} minW="auto"
              >
                <Icon icon="mdi:content-copy" width={14} height={14} />
              </Button>
            </HStack>
          </VStack>
        )}

        {!loadingTeam && <CustomButton label="Done" onClick={onDone} w="100%" />}

        <QrScannerDialog
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={(value) => setMemberIdInput(value)}
          title="Scan Member QR Code"
        />
      </VStack>
    );
  }

  return (
    <VStack gap={5} w="100%" align="stretch">
      <Flex
        w="100%"
        border="1px solid"
        borderColor="primary-3"
        bg="primary-12"
        borderRadius="10px"
        align="center"
        px={3}
        transition="all 0.2s ease-in-out"
        _focusWithin={{ borderColor: "primary-2", boxShadow: "0 0 0 1px var(--chakra-colors-primary-4)" }}
      >
        <ChakraInput
          placeholder="Team Name"
          color="neutral-1"
          border="none"
          outline="none"
          _focus={{ boxShadow: "none" }}
          _placeholder={{ color: "neutral-3" }}
          fontSize="0.9rem"
          py="var(--global-spacing)"
          flex={1}
          value={teamName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)}
        />
      </Flex>

      <Text fontSize="sm" color="neutral-2" fontWeight="semibold">
        Members ({totalMembers} of {maxTeamMembers})
      </Text>

      {/* Creator (you) — shown as first member */}
      <Flex
        justify="space-between"
        align="center"
        bg="primary-12"
        px={3} py={2}
        rounded="md"
        border="1px solid"
        borderColor="primary-3"
      >
        <HStack gap={2}>
          <Icon icon="mdi:account-circle" width={20} height={20} />
          <Text fontSize="sm">{userName} (Leader)</Text>
        </HStack>
        {userJoinCode && (
          <Text fontSize="xs" color="neutral-3" fontFamily="mono">
            ID: {userJoinCode}
          </Text>
        )}
      </Flex>

      {/* Added members */}
      {members.map((m, i) => (
        <Flex
          key={i}
          justify="space-between"
          align="center"
          bg="primary-12"
          px={3} py={2}
          rounded="md"
          border="1px solid"
          borderColor="primary-3"
        >
          <Text fontSize="sm">{m.name}</Text>
          <HStack gap={2}>
            <Text
              fontSize="xs"
              color={m.status === "added" ? "green.300" : "yellow.300"}
              fontWeight="bold"
            >
              {m.status === "added" ? "Added" : "Pending"}
            </Text>
            <Button
              size="xs"
              bg="transparent"
              color="red.300"
              _hover={{ bg: "rgba(255,0,0,0.1)" }}
              onClick={() => handleRemoveMember(i)}
              p={1} minW="auto"
            >
              <Icon icon="mdi:close" width={14} height={14} />
            </Button>
          </HStack>
        </Flex>
      ))}

      {/* Add member input — icons inline inside the field */}
      <Flex
        w="100%"
        border="1px solid"
        borderColor="primary-3"
        bg="primary-12"
        borderRadius="10px"
        align="center"
        px={3}
        transition="all 0.2s ease-in-out"
        _focusWithin={{ borderColor: "primary-2", boxShadow: "0 0 0 1px var(--chakra-colors-primary-4)" }}
      >
        <ChakraInput
          placeholder="Enter member ID"
          color="neutral-1"
          border="none"
          outline="none"
          _focus={{ boxShadow: "none" }}
          _placeholder={{ color: "neutral-3" }}
          fontSize="0.9rem"
          py="var(--global-spacing)"
          flex={1}
          value={memberIdInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberIdInput(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleAddMember()}
        />
        <HStack gap={1}>
          <Button
            bg="transparent"
            color={memberIdInput.trim() ? "primary-1" : "neutral-3"}
            _hover={{ color: "primary-2" }}
            p={1} minW="auto" h="auto"
            onClick={handleAddMember}
            loading={addingMember}
            disabled={!memberIdInput.trim()}
          >
            <Icon icon="mdi:plus" width={20} height={20} />
          </Button>
          <Button
            bg="transparent"
            color="neutral-2"
            _hover={{ color: "primary-1" }}
            p={1} minW="auto" h="auto"
            onClick={() => setShowScanner(true)}
          >
            <Icon icon="mdi:qrcode-scan" width={18} height={18} />
          </Button>
        </HStack>
      </Flex>

      <CustomButton
        label="Create team"
        onClick={handleCreateTeam}
        loading={loading}
        loadingText="Creating..."
        w="100%"
      />

      <QrScannerDialog
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(value) => setMemberIdInput(value)}
        title="Scan Member QR Code"
      />
    </VStack>
  );
}

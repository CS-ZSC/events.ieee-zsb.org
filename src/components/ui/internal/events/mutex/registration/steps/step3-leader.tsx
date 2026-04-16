"use client";

import { useEffect, useState } from "react";
import {
  VStack,
  Flex,
  Box,
  Heading,
  Text,
  Spinner,
  HStack,
  Button,
} from "@chakra-ui/react";
import BackButton from "../back-button";
import Input from "@/components/ui/internal/input";
import CustomButton from "../custom-button";
import { Portal, Select, createListCollection } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { createTeam, addMember, removeMember, type ApiTeamMember } from "@/api/team";
import { getCompetitions, ensureEventRegistration, checkEventRegistration, type ApiCompetition } from "@/api/competitions";
import { Icon } from "@iconify/react";

interface MemberEntry {
  joinCode: string;
  name: string;
  status: "pending" | "added";
  teamMember?: ApiTeamMember;
}

export default function Step3Leader({
  handleBack,
  handleNext,
  competitionIdParam,
  eventSlug,
  onTeamCreated,
}: {
  handleBack: () => void;
  handleNext: () => void;
  competitionIdParam?: number;
  eventSlug: string;
  onTeamCreated: (competitionId: number, teamId: number) => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [teamCompetitions, setTeamCompetitions] = useState<ApiCompetition[]>([]);
  const [loadingComps, setLoadingComps] = useState(true);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState<number | null>(null);

  useEffect(() => {
    getCompetitions()
      .then((comps) => {
        const teamComps = comps.filter((c) => c.type === "team");
        setTeamCompetitions(teamComps);
        if (competitionIdParam) {
          const match = teamComps.find((c) => c.id === competitionIdParam);
          if (match) {
            setSelectedCompetition([String(match.id)]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingComps(false));
  }, [competitionIdParam]);

  const selectedComp = teamCompetitions.find(
    (c) => String(c.id) === selectedCompetition[0]
  );
  const maxMembers = selectedComp?.max_team_members ?? 5;

  const competitionsCollection = createListCollection({
    items: teamCompetitions.map((c) => ({ label: c.name, value: String(c.id) })),
  });

  async function handleCreateTeam() {
    if (loading) return;
    if (!teamName.trim() || !selectedCompetition.length) {
      toaster.error({
        closable: true,
        title: "Missing Fields",
        description: "Please enter a team name and select a competition.",
        duration: 3000,
      });
      return;
    }

    const competitionId = Number(selectedCompetition[0]);
    setLoading(true);

    try {
      // Ensure event registration (team creation handles competition registration)
      const eventStatus = await checkEventRegistration(eventSlug);
      if (!eventStatus.registered) {
        await ensureEventRegistration(eventSlug);
      }
      const team = await createTeam(competitionId, teamName);
      setCreatedTeamId(team.id);
      setLoading(false);
      toaster.success({
        closable: true,
        title: "Team Created",
        description: "Your team has been successfully created.",
        duration: 5000,
      });
      onTeamCreated(competitionId, team.id);
      handleNext();
    } catch (err: any) {
      setLoading(false);
      const message = err.response?.data?.message || "Please try again later.";
      toaster.error({
        closable: true,
        title: "Team Creation Failed",
        description: message,
        duration: 5000,
      });
    }
  }

  async function handleAddMember() {
    if (!memberIdInput.trim()) return;
    if (!selectedCompetition.length) {
      toaster.error({
        closable: true,
        title: "Select Competition",
        description: "Please select a competition first.",
        duration: 3000,
      });
      return;
    }

    // Members can only be added after team is created
    if (!createdTeamId) {
      // Check max members before queuing
      if (1 + members.length >= maxMembers) {
        toaster.error({ closable: true, title: "Team Full", description: `Maximum ${maxMembers} members allowed.`, duration: 3000 });
        return;
      }
      // Queue the member for later
      setMembers((prev) => [
        ...prev,
        { joinCode: memberIdInput.trim(), name: memberIdInput.trim(), status: "pending" },
      ]);
      setMemberIdInput("");
      return;
    }

    const competitionId = Number(selectedCompetition[0]);
    setAddingMember(true);
    try {
      const tm = await addMember(competitionId, memberIdInput.trim());
      setMembers((prev) => [
        ...prev,
        {
          joinCode: memberIdInput.trim(),
          name: tm.event_participant.user.name,
          status: "added",
          teamMember: tm,
        },
      ]);
      setMemberIdInput("");
      toaster.success({
        closable: true,
        title: "Member Added",
        description: `${tm.event_participant.user.name} has been added to the team.`,
        duration: 3000,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to add member.";
      toaster.error({
        closable: true,
        title: "Add Failed",
        description: message,
        duration: 5000,
      });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(index: number) {
    const member = members[index];
    if (createdTeamId && member.status === "added") {
      const competitionId = Number(selectedCompetition[0]);
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

  return (
    <VStack color="neutral-1" gap={6} position="relative">
      <Flex
        justifyContent="center"
        alignItems="center"
        width="100%"
        position="relative"
      >
        <Box position="absolute" left={0}>
          <BackButton handleBack={handleBack} />
        </Box>
        <Heading size="md" textAlign="center">
          Create a team
        </Heading>
      </Flex>

      <Flex flexDir="column" gap={3} w="100%" maxW="400px">
        <Box>
          <Input
            placeholder="Team Name"
            color="neutral-1"
            w="100%"
            value={teamName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)}
          />
        </Box>

        {loadingComps ? (
          <Flex justify="center" py={4}>
            <Spinner color="primary-1" />
          </Flex>
        ) : (
          <DropDownSelection
            collection={competitionsCollection}
            selectedCompetition={selectedCompetition}
            setSelectedCompetition={setSelectedCompetition}
          />
        )}

        {/* Add Member Section */}
        <HStack gap={2}>
          <Input
            placeholder="Enter member ID"
            color="neutral-1"
            flex={1}
            value={memberIdInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberIdInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleAddMember()}
          />
          <Button
            bg="primary-1"
            color="neutral-1"
            rounded="xl"
            w="40px"
            h="40px"
            minW="40px"
            p={0}
            _hover={{ opacity: 0.9 }}
            onClick={handleAddMember}
            loading={addingMember}
            disabled={!memberIdInput.trim()}
          >
            <Icon icon="mdi:plus" width={20} height={20} />
          </Button>
          <Button
            bg="primary-3"
            color="neutral-1"
            rounded="xl"
            w="40px"
            h="40px"
            minW="40px"
            p={0}
            _hover={{ opacity: 0.9 }}
            onClick={() =>
              toaster.info({
                closable: true,
                title: "Coming Soon",
                description: "QR scanner will be available soon.",
                duration: 3000,
              })
            }
          >
            <Icon icon="mdi:qrcode-scan" width={20} height={20} />
          </Button>
        </HStack>

        {/* Members List */}
        {members.length > 0 && (
          <VStack gap={2} align="stretch">
            {members.map((m, i) => (
              <Flex
                key={i}
                justify="space-between"
                align="center"
                bg="primary-12"
                px={3}
                py={2}
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
                    p={1}
                    minW="auto"
                  >
                    <Icon icon="mdi:close" width={14} height={14} />
                  </Button>
                </HStack>
              </Flex>
            ))}
          </VStack>
        )}

        <Text fontSize="xs" color="neutral-2" fontStyle="italic">
          You can still add members up to {maxMembers} members after creating the team from your profile page.
        </Text>
      </Flex>

      <CustomButton
        label="Create team"
        onClick={handleCreateTeam}
        loading={loading}
        loadingText="Creating..."
        w="100%"
      />
    </VStack>
  );
}

function DropDownSelection({
  collection,
  selectedCompetition,
  setSelectedCompetition,
}: {
  collection: ReturnType<typeof createListCollection<{ label: string; value: string }>>;
  selectedCompetition: string[];
  setSelectedCompetition: (comp: string[]) => void;
}) {
  return (
    <Select.Root
      collection={collection}
      size="lg"
      width="100%"
      bgColor={"primary-12"}
      outline={"none"}
      borderRadius="10px"
      border="1px solid"
      borderColor="primary-3"
      color="natural-2"
      cursor={"pointer"}
      value={selectedCompetition}
      multiple={false}
      onValueChange={(e) => setSelectedCompetition(e.value)}
    >
      <Select.Control>
        <Select.Trigger
          cursor={"pointer"}
          border="none"
          outline="none"
          _focus={{ outline: "none", boxShadow: "none" }}
          _focusVisible={{ outline: "none", boxShadow: "none" }}
        >
          <Select.ValueText placeholder="Select competition" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content color={"neutral-1"} bg={"primary-3"} rounded={"2xl"}>
            {collection.items.map((competition: { label: string; value: string }) => (
              <Select.Item item={competition} key={competition.value}>
                {competition.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}

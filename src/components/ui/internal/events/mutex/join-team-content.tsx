"use client";

import { useState, useEffect } from "react";
import { VStack, Text, HStack, Button, Box, Input } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { QRCodeSVG } from "qrcode.react";
import { Icon } from "@iconify/react";
import CustomButton from "@/components/ui/internal/events/mutex/registration/custom-button";
import { joinTeam } from "@/api/team";
import { ensureEventRegistration, checkEventRegistration } from "@/api/competitions";
import QrScannerDialog from "@/components/ui/internal/events/mutex/qr-scanner-dialog";

interface Props {
  competitionId: number;
  eventSlug: string;
  onDone: () => void;
  onTeamJoined?: () => void;
}

export default function JoinTeamContent({ competitionId, eventSlug, onDone, onTeamJoined }: Props) {
  const [userJoinCode, setUserJoinCode] = useState<string>("");
  const [teamCode, setTeamCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user-data");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserJoinCode(parsed.join_code || "");
      }
    } catch {
      // Malformed localStorage data
    }
  }, []);

  function handleCopyCode() {
    navigator.clipboard.writeText(userJoinCode).catch(() => {});
    toaster.success({
      closable: true,
      title: "Copied!",
      description: "Your ID has been copied to clipboard.",
      duration: 2000,
    });
  }

  async function handleJoinTeam() {
    if (!teamCode.trim()) {
      toaster.create({ title: "Enter a team code", type: "warning", duration: 2000 });
      return;
    }
    setJoining(true);
    try {
      // Ensure event registration (joining team handles competition registration)
      const eventStatus = await checkEventRegistration(eventSlug);
      if (!eventStatus.registered) {
        await ensureEventRegistration(eventSlug);
      }
      await joinTeam(competitionId, teamCode.trim());
      toaster.create({ title: "Joined team!", type: "success", duration: 3000 });
      onTeamJoined?.();
      onDone();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to join team.";
      const status = err.response?.status;
      if (status === 409) {
        toaster.create({ title: "Already in a team", description: message, type: "info" });
      } else if (status === 404) {
        toaster.create({ title: "Team not found", description: "Check the code and try again.", type: "error" });
      } else if (status === 422) {
        toaster.create({ title: "Cannot join", description: message, type: "warning" });
      } else {
        toaster.create({ title: "Failed to join team", description: message, type: "error" });
      }
    } finally {
      setJoining(false);
    }
  }

  return (
    <VStack gap={5} align="center">
      {/* Option 1: Enter team code to join */}
      <Text color="neutral-1" fontWeight="bold" fontSize="md">
        Join with Team Code
      </Text>
      <HStack gap={2} w="100%">
        <Input
          placeholder="Enter team join code"
          value={teamCode}
          onChange={(e) => setTeamCode(e.target.value)}
          bg="primary-12"
          border="1px solid"
          borderColor="primary-3"
          color="neutral-1"
          _placeholder={{ color: "neutral-4" }}
          rounded="lg"
          flex={1}
          onKeyDown={(e) => { if (e.key === "Enter") handleJoinTeam(); }}
        />
        <Button
          bg="transparent"
          color="neutral-2"
          _hover={{ color: "primary-1" }}
          p={2} minW="auto" h="auto"
          borderRadius="8px"
          onClick={() => setShowScanner(true)}
        >
          <Icon icon="mdi:qrcode-scan" width={20} height={20} />
        </Button>
        <Button
          bg="primary-1"
          color="white"
          _hover={{ bg: "primary-2" }}
          borderRadius="8px"
          fontWeight="bold"
          loading={joining}
          onClick={handleJoinTeam}
          px={4}
        >
          Join
        </Button>
      </HStack>

      <Box w="100%" borderTop="1px solid" borderColor="primary-3" my={1} />

      {/* Option 2: Share your code for leader to add you */}
      {userJoinCode && (
        <>
          <Text color="neutral-3" fontSize="sm">
            Or share your code with the team leader
          </Text>

          <Box bg="white" p={3} rounded="lg">
            <QRCodeSVG value={userJoinCode} size={140} />
          </Box>

          <HStack
            gap={2}
            border="1px solid"
            borderColor="primary-3"
            rounded="lg"
            px={4}
            py={2.5}
            bg="primary-12"
          >
            <Text fontSize="md" fontFamily="mono" fontWeight="bold">
              {userJoinCode}
            </Text>
            <Button
              size="xs"
              color="neutral-2"
              bg="transparent"
              _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
              onClick={handleCopyCode}
              p={1}
              minW="auto"
            >
              <Icon icon="mdi:content-copy" width={16} height={16} />
            </Button>
          </HStack>
        </>
      )}

      <CustomButton label="Done" onClick={onDone} w="100%" />

      <QrScannerDialog
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(value) => setTeamCode(value)}
        title="Scan Team Code"
      />
    </VStack>
  );
}

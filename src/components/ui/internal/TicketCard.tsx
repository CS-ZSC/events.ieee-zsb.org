"use client";

import React from "react";
import { Box, Flex, Text, Image } from "@chakra-ui/react";
import { Icon } from "@iconify/react";
import { QRCodeSVG } from "qrcode.react";
import { useColorModeValue } from "@/components/ui/color-mode";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TicketEvent {
  id: number;
  name: string;
  slug: string;
  cover_image: string | null;
  start_date: string;
  location: string | null;
}

export interface Ticket {
  id: number;
  ticket_type: string | null;
  qr_code: string;
  status: "pending" | "verified" | "checked_in" | "cancelled" | string;
  created_at: string;
  updated_at: string;
  event_participant: {
    id: number;
    role: string;
    event: TicketEvent;
  };
}

export interface TicketCardProps {
  ticket: Ticket;
  eventName: string;
  eventImage: string;
  time: string;
  location: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusConfig(status: string): { bg: string; color: string; border: string; label: string; icon: string } {
  switch (status) {
    case "verified":
      return { bg: "rgba(34,197,94,0.15)", color: "#22c55e", border: "rgba(34,197,94,0.3)", label: "Verified", icon: "solar:check-circle-bold" };
    case "checked_in":
      return { bg: "rgba(129,140,248,0.15)", color: "#818cf8", border: "rgba(129,140,248,0.3)", label: "Checked In", icon: "solar:qr-code-bold" };
    case "cancelled":
      return { bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "rgba(239,68,68,0.3)", label: "Cancelled", icon: "solar:close-circle-bold" };
    case "pending":
    default:
      return { bg: "rgba(234,179,8,0.15)", color: "#eab308", border: "rgba(234,179,8,0.3)", label: "Pending", icon: "solar:clock-circle-bold" };
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TicketCard({ ticket, eventName, eventImage, time, location }: TicketCardProps) {
  const status = statusConfig(ticket.status);
  const qrFg = useColorModeValue("#003A5A", "#A0D4EB");
  const role = ticket.event_participant.role;
  const isCheckedIn = ticket.status === "checked_in";
  const isCancelled = ticket.status === "cancelled";

  return (
    <Box
      maxW="380px"
      w="full"
      mx="auto"
      opacity={isCancelled ? 0.6 : 1}
      transition="transform 0.2s"
      _hover={{ transform: "translateY(-4px)" }}
    >
      {/* ── Top section ─────────────────────────────────────────────────── */}
      <Box
        bg="primary-5"
        border="1px solid"
        borderColor="primary-3"
        // borderTopRadius="2xl"
        overflow="hidden"
      >
        {/* Cover image with gradient overlay */}
        <Box position="relative" h="190px" overflow="hidden">
          <Image src={eventImage} alt={eventName} w="full" h="full" objectFit="cover" />
          <Box
            position="absolute"
            inset={0}
            background="linear-gradient(to top, rgba(0,16,26,0.85) 0%, rgba(0,16,26,0.3) 50%, transparent 100%)"
          />

          {/* Status badge */}
          <Flex
            position="absolute"
            top={3}
            right={3}
            align="center"
            gap={1.5}
            px={2.5}
            py={1}
            borderRadius="full"
            bg={status.bg}
            backdropFilter="blur(12px)"
            border="1px solid"
            borderColor={status.border}
          >
            <Icon icon={status.icon} width={13} color={status.color} />
            <Text fontSize="xs" fontWeight="bold" color={status.color} lineHeight={1}>
              {status.label}
            </Text>
          </Flex>

          {/* Event name + role */}
          <Box position="absolute" bottom={3} left={4} right={4}>
            <Text fontWeight="bold" fontSize="xl" color="white" lineClamp={2} lineHeight="tight" mb={1.5}>
              {eventName}
            </Text>
            <Box
              display="inline-block"
              px={2}
              py={0.5}
              borderRadius="full"
              bg="rgba(0,102,153,0.5)"
              border="1px solid rgba(0,102,153,0.6)"
              backdropFilter="blur(8px)"
            >
              <Text fontSize="xs" fontWeight="bold" color="#A0D4EB" textTransform="capitalize">
                {role}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Time & location */}
        <Box px={5} pt={4} pb={5}>
          <Flex align="center" gap={2} mb={2}>
            <Icon icon="solar:clock-circle-outline" width={16} color="#A0D4EB" style={{ flexShrink: 0 }} />
            <Text fontSize="sm" color="neutral-2">{time}</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Icon icon="solar:map-point-outline" width={16} color="#A0D4EB" style={{ flexShrink: 0 }} />
            <Text fontSize="sm" color="neutral-2">{location}</Text>
          </Flex>
        </Box>
      </Box>

      {/* ── Perforated divider ───────────────────────────────────────────── */}
      <Flex align="center" position="relative">
        {/* Left notch */}
        <Box
          w="24px"
          h="24px"
          borderRadius="full"
          bg="bg"
          border="1px solid"
          borderColor="primary-3"
          flexShrink={0}
          ml="-12px"
          zIndex={1}
        />
        {/* Dashed line */}
        <Box flex={1} borderTop="2px dashed" borderColor="primary-3" />
        {/* Right notch */}
        <Box
          w="24px"
          h="24px"
          borderRadius="full"
          bg="bg"
          border="1px solid"
          borderColor="primary-3"
          flexShrink={0}
          mr="-12px"
          zIndex={1}
        />
      </Flex>

      {/* ── QR / Checked-in section ──────────────────────────────────────── */}
      <Box
        bg="primary-5"
        border="1px solid"
        borderColor="primary-3"
        borderBottomRadius="2xl"
        px={5}
        py={6}
      >
        {isCheckedIn ? (
          <Flex direction="column" align="center" gap={3}>
            <Flex
              w="72px"
              h="72px"
              borderRadius="full"
              bg="rgba(129,140,248,0.12)"
              border="2px solid"
              borderColor="#818cf8"
              align="center"
              justify="center"
            >
              <Icon icon="solar:check-read-bold" width={36} color="#818cf8" />
            </Flex>
            <Box textAlign="center">
              <Text color="#818cf8" fontWeight="bold" fontSize="md" mb={0.5}>
                Already Checked In
              </Text>
              <Text color="neutral-3" fontSize="xs">
                Your attendance has been recorded
              </Text>
            </Box>
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap={3}>
            <Box bg="white" p={3} borderRadius="xl">
              <QRCodeSVG value={ticket.qr_code} size={130} fgColor={qrFg} bgColor="#ffffff" level="M" />
            </Box>
            <Text color="neutral-3" fontSize="xs">
              Scan at the entrance
            </Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
}

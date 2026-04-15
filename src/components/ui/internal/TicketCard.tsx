"use client";

import React from "react";
import { Box, Flex, Text, Button, Image } from "@chakra-ui/react";
import { Icon } from "@iconify/react";
import { QRCodeSVG } from "qrcode.react";
import { useColorModeValue } from "@/components/ui/color-mode";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Ticket {
  id: number;
  ticket_type: string;
  qr_code: string;
  status: "pending" | "verified" | "cancelled" | string;
  event_id?: number;
  competition_id?: number;
  created_at: string;
  updated_at: string;
}

export interface TicketCardProps {
  ticket: Ticket;
  eventName: string;
  eventImage: string;
  time: string;
  location: string;
  onCancel?: (ticketId: number) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusColor(status: string): { bg: string; color: string } {
  switch (status) {
    case "verified":
      return { bg: "rgba(34,197,94,0.2)", color: "#22c55e" };
    case "cancelled":
      return { bg: "rgba(239,68,68,0.2)", color: "#ef4444" };
    case "pending":
    default:
      return { bg: "rgba(234,179,8,0.2)", color: "#eab308" };
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TicketCard({
  ticket,
  eventName,
  eventImage,
  time,
  location,
  onCancel,
}: TicketCardProps) {
  const badge = statusColor(ticket.status);
  const qrFg = useColorModeValue("#003A5A", "#A0D4EB");
  const qrBg = useColorModeValue("#FFFFFF", "transparent");

  return (
    <Box
      bg="primary-5"
      border="1px solid"
      borderColor="primary-3"
      borderRadius="2xl"
      overflow="hidden"
      maxW="400px"
      w="full"
      mx="auto"
      transition="transform 0.2s, box-shadow 0.2s"
      _hover={{ transform: "translateY(-4px)", boxShadow: "lg" }}
    >
      {/* ── Event image ─────────────────────────────────────────────────── */}
      <Box overflow="hidden" borderRadius="xl" m={3}>
        <Image
          src={eventImage}
          alt={eventName}
          w="full"
          h="200px"
          objectFit="cover"
          borderRadius="xl"
        />
      </Box>

      {/* ── Details ─────────────────────────────────────────────────────── */}
      <Box px={5} pb={5} pt={2}>
        {/* Title + badge row */}
        <Flex align="center" justify="space-between" mb={3}>
          <Flex align="center" gap={2} minW={0} flex={1}>
            <Icon
              icon="solar:ticket-bold"
              width={22}
              height={22}
              color="#FFC000"
              style={{ flexShrink: 0 }}
            />
            <Text
              fontWeight="bold"
              fontSize="lg"
              color="neutral-1"
              truncate
            >
              {eventName}
            </Text>
          </Flex>

          <Box
            ml={2}
            px={3}
            py={0.5}
            borderRadius="full"
            fontSize="xs"
            fontWeight="bold"
            textTransform="capitalize"
            bg={badge.bg}
            color={badge.color}
            flexShrink={0}
          >
            {ticket.status}
          </Box>
        </Flex>

        {/* Time */}
        <Flex align="center" gap={2} mb={1.5}>
          <Icon
            icon="solar:clock-circle-outline"
            width={18}
            height={18}
            color="#A0D4EB"
            style={{ flexShrink: 0 }}
          />
          <Text fontSize="sm" color="neutral-2">
            {time}
          </Text>
        </Flex>

        {/* Location */}
        <Flex align="center" gap={2} mb={4}>
          <Icon
            icon="solar:map-point-outline"
            width={18}
            height={18}
            color="#A0D4EB"
            style={{ flexShrink: 0 }}
          />
          <Text fontSize="sm" color="neutral-2">
            {location}
          </Text>
        </Flex>

        {/* QR Code */}
        <Flex justify="center" mb={4}>
          <Box bg="white" p={3} borderRadius="xl">
            <QRCodeSVG
              value={ticket.qr_code}
              size={120}
              fgColor={qrFg}
              bgColor={qrBg}
              level="M"
            />
          </Box>
        </Flex>

        {/* Cancel button */}
        <Button
          w="full"
          bg="primary-1"
          color="white"
          borderRadius="xl"
          fontWeight="bold"
          py={6}
          _hover={{ bg: "primary-2" }}
          onClick={() => onCancel?.(ticket.id)}
        >
          Cancel ticket
        </Button>
      </Box>
    </Box>
  );
}

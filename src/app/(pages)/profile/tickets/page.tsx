"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Grid, Heading, Text, Button, Stack } from "@chakra-ui/react";
import { MoonLoader } from "react-spinners";
import { useColorModeValue } from "@/components/ui/color-mode";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import TicketCard, { Ticket } from "@/components/ui/internal/TicketCard";
import Breadcrumb from "@/components/ui/internal/breadcrumb";
import { useRouter } from "next/navigation";
import api from "@/api";
import { getEvents, ApiEvent } from "@/api/events";
import { getCompetitions, ApiCompetition } from "@/api/competitions";

// ── Resolved ticket ────────────────────────────────────────────────────────────
// Ticket enriched with event/competition display data for the card.

interface ResolvedTicket {
  ticket: Ticket;
  eventName: string;
  eventImage: string;
  time: string;
  location: string;
}

// ── Fallback values when event data can't be matched ───────────────────────────

const FALLBACK_IMAGE = "/images/ieee/Rectangle 114.png";
const FALLBACK_NAME = "IEEE Event";
const FALLBACK_TIME = "TBA";
const FALLBACK_LOCATION = "Zagazig University – Faculty of engineering";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return FALLBACK_TIME;
  }
}

function resolveTickets(
  tickets: Ticket[],
  eventsMap: Map<number | string, ApiEvent>,
  competitionsMap: Map<number, ApiCompetition>,
): ResolvedTicket[] {
  return tickets.map((ticket) => {
    let eventName = FALLBACK_NAME;
    let eventImage = FALLBACK_IMAGE;

    // Try to match by event_id first
    if (ticket.event_id && eventsMap.has(ticket.event_id)) {
      const event = eventsMap.get(ticket.event_id)!;
      eventName = event.name;
      eventImage = event.image || event.cover_image || FALLBACK_IMAGE;
    }
    // Try to match by competition_id
    else if (ticket.competition_id && competitionsMap.has(ticket.competition_id)) {
      const comp = competitionsMap.get(ticket.competition_id)!;
      eventName = comp.name;
      // Competitions don't have their own image — use parent event image
      if (comp.event_id && eventsMap.has(comp.event_id)) {
        eventImage = eventsMap.get(comp.event_id)!.image || FALLBACK_IMAGE;
      }
    }

    return {
      ticket,
      eventName,
      eventImage,
      time: formatDate(ticket.created_at),
      location: FALLBACK_LOCATION,
    };
  });
}

// ── Page Component ─────────────────────────────────────────────────────────────

export default function MyTickets() {
  const router = useRouter();
  const spinnerColor = useColorModeValue("black", "white");

  const [resolved, setResolved] = useState<ResolvedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tickets, events, and competitions concurrently
        const [ticketsRes, events, competitions] = await Promise.all([
          api.get("/eventsgate/tickets/my-tickets"),
          getEvents().catch(() => [] as ApiEvent[]),
          getCompetitions().catch(() => [] as ApiCompetition[]),
        ]);

        const tickets: Ticket[] = ticketsRes.data?.data ?? [];

        if (tickets.length === 0) {
          setIsEmpty(true);
          return;
        }

        // Build lookup maps for O(1) matching
        const eventsMap = new Map<number | string, ApiEvent>();
        events.forEach((e) => eventsMap.set(Number(e.id), e));

        const competitionsMap = new Map<number, ApiCompetition>();
        competitions.forEach((c) => competitionsMap.set(c.id, c));

        setResolved(resolveTickets(tickets, eventsMap, competitionsMap));
      } catch (err: unknown) {
        console.error("Failed to fetch tickets", err);
        setIsEmpty(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageWrapper>
        <Flex direction="column" align="center" justify="center" py={10} minH="70vh">
          <MoonLoader color={spinnerColor} size={50} />
        </Flex>
      </PageWrapper>
    );
  }

  // ── Empty / unauthorized state ───────────────────────────────────────────────
  if (isEmpty || resolved.length === 0) {
    return (
      <PageWrapper>
        <Flex direction="column" align="center" py={10} minH="70vh">
          <Heading mb={12} color="neutral-1" fontSize="2xl" fontWeight="bold">
            My tickets
          </Heading>

          <Box
            w="full"
            maxWidth="900px"
            p={{ base: 10, md: 20 }}
            bg="primary-5"
            borderRadius="3xl"
            border="1px solid"
            borderColor="primary-3"
            backdropFilter="blur(16px)"
            textAlign="center"
          >
            <Stack gap={8} align="center">
              <Text color="neutral-2" fontSize={{ base: "lg", md: "xl" }}>
                You aren&apos;t registered in any event or competition
              </Text>

              <Button
                bg="primary-1"
                color="white"
                px={10}
                py={7}
                borderRadius="xl"
                fontSize="lg"
                fontWeight="bold"
                _hover={{ bg: "primary-2" }}
                onClick={() => router.push("/")}
              >
                See available events and competitions
              </Button>
            </Stack>
          </Box>
        </Flex>
      </PageWrapper>
    );
  }

  // ── Tickets grid ─────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Profile", href: "/profile" }, { label: "Tickets" }]} />
      <Flex direction="column" align="center" py={10} minH="70vh">
        <Heading mb={12} color="neutral-1" fontSize="2xl" fontWeight="bold">
          My tickets
        </Heading>

        <Box
          w="full"
          maxWidth="900px"
          p={{ base: 6, md: 10 }}
          bg="primary-5"
          borderRadius="3xl"
          border="1px solid"
          borderColor="primary-3"
          backdropFilter="blur(16px)"
        >
          <Grid
            templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
            gap={6}
            justifyItems="center"
          >
            {resolved.map(({ ticket, eventName, eventImage, time, location }) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                eventName={eventName}
                eventImage={eventImage}
                time={time}
                location={location}
                onCancel={(id) => {
                  console.log("Cancel ticket", id);
                  // TODO: wire up cancel API
                }}
              />
            ))}
          </Grid>
        </Box>
      </Flex>
    </PageWrapper>
  );
}
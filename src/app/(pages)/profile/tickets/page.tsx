"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Grid, Heading, Text, Button, Stack } from "@chakra-ui/react";
import { MoonLoader } from "react-spinners";
import { useColorModeValue } from "@/components/ui/color-mode";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import TicketCard, { Ticket } from "@/components/ui/internal/TicketCard";
import Breadcrumb from "@/components/ui/internal/breadcrumb";
import { useRouter } from "next/navigation";
import api, { API_LINK } from "@/api";

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
    return "TBA";
  }
}

export default function MyTickets() {
  const router = useRouter();
  const spinnerColor = useColorModeValue("black", "white");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    api
      .get("/eventsgate/tickets/my-tickets")
      .then((res) => {
        const data: Ticket[] = res.data?.data ?? [];
        if (data.length === 0) setIsEmpty(true);
        else setTickets(data);
      })
      .catch(() => setIsEmpty(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <Flex direction="column" align="center" justify="center" py={10} minH="70vh">
          <MoonLoader color={spinnerColor} size={50} />
        </Flex>
      </PageWrapper>
    );
  }

  if (isEmpty) {
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
            {tickets.map((ticket) => {
              const event = ticket.event_participant.event;
              return (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  eventName={event.name}
                  eventImage={event.cover_image ? `${API_LINK}/storage/${event.cover_image}` : ""}
                  time={event.start_date ? formatDate(event.start_date) : "TBA"}
                  location={event.location ?? "TBA"}
                />
              );
            })}
          </Grid>
        </Box>
      </Flex>
    </PageWrapper>
  );
}

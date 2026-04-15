"use client";

import React, { useEffect, useState } from "react";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import { Flex, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import CompetitionCard from "@/components/ui/internal/events/mutex/competition-card";
import { useWindowType } from "@/hooks/use-window-type";
import { getCompetitions, type ApiCompetition } from "@/api/competitions";

export default function Competitions({
  eventSlug,
  eventId,
  competitionsDescription,
}: {
  eventSlug: string;
  eventId?: number | string;
  competitionsDescription?: string;
}) {
  const { isDesktop } = useWindowType();
  const [competitions, setCompetitions] = useState<ApiCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCompetitions()
      .then((data) => {
        if (cancelled) return;
        const filtered = eventId
          ? data.filter((c) => String(c.event_id) === String(eventId))
          : data;
        setCompetitions(filtered);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load competitions UI:", err);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  return (
    <Flex
      flexDir={"column"}
      alignItems="center"
      justifyContent="center"
      gap={4}
    >
      <SectionTitle title="Competitions" />
      <SectionDescription
        description={competitionsDescription || "Explore our diverse set of competitions."}
      />

      {loading ? (
        <Spinner color="primary-1" size="xl" />
      ) : error ? (
        <Text color="red.400">Failed to load competitions.</Text>
      ) : competitions.length === 0 ? (
        <Text color="neutral-2">No competitions available yet.</Text>
      ) : (
        <SimpleGrid
          columns={isDesktop ? 3 : 1}
          justifyContent="center"
          gap={8}
          p={4}
        >
          {competitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              eventSlug={eventSlug}
            />
          ))}
        </SimpleGrid>
      )}
    </Flex>
  );
}
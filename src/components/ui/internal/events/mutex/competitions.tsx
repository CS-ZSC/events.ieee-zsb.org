"use client";

import React, { useEffect, useState } from "react";
import type { Event } from "@/data/events";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import { Flex, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import CompetitionCard from "@/components/ui/internal/events/mutex/competition-card";
import { useWindowType } from "@/hooks/use-window-type";
import { getCompetitions, type ApiCompetition } from "@/api/competitions";

export default function Competitions({ event }: { event: Event }) {
  const { isDesktop } = useWindowType();
  const [competitions, setCompetitions] = useState<ApiCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCompetitions()
      .then(setCompetitions)
      .catch((err) => {
        console.error("Failed to load competitions UI:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Flex
      flexDir={"column"}
      alignItems="center"
      justifyContent="center"
      gap={4}
    >
      <SectionTitle title="Competitions" />
      <SectionDescription description={event.competitionsDescription} />

      {loading ? (
        <Spinner color="primary-1" size="xl" />
      ) : error ? (
        <Text color="red.400">Failed to load competitions.</Text>
      ) : competitions.length === 0 ? (
        <Text color="neutral-2">No competitions available yet.</Text>
      ) : (
        <SimpleGrid
          columns={isDesktop ? 2 : 1}
          justifyContent="center"
          gap={8}
          p={4}
        >
          {competitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={{
                id: competition.id,
                name: competition.name,
                shortName: competition.short_name,
                image: competition.image,
                description: competition.description,
                link: `/events/${event.slug}/${competition.short_name}`,
                overview: competition.overview,
                trophiesDescription: competition.trophies_description,
                rulesDescription: competition.rules_description,
                rulebook: competition.rulebook ?? undefined,
              }}
            />
          ))}
        </SimpleGrid>
      )}
    </Flex>
  );
}
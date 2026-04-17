"use client";

import React from "react";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import { Flex, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import CompetitionCard from "@/components/ui/internal/events/mutex/competition-card";
import { useWindowType } from "@/hooks/use-window-type";
import { useAuth } from "@/atoms/auth";
import { useCompetitions, useCompetitionRegistrations } from "@/hooks/use-competitions";

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
  const userData = useAuth();
  const { data: competitions = [], isLoading: loadingCompetitions, error: compError } = useCompetitions(eventId);
  const { data: registeredMap = {}, isLoading: loadingRegs } = useCompetitionRegistrations(competitions, userData?.id);
  const loading = loadingCompetitions || (!!userData?.id && loadingRegs);
  const error = !!compError;

  if (loading) {
    return (
      <Flex justifyContent="center" py={8}>
        <Spinner size="lg" color="primary-1" />
      </Flex>
    );
  }

  if (competitions.length === 0) {
    return <div />
  }

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
          {competitions.map((competition) => {
            const isRegistered = registeredMap[competition.id] ?? false;
            // Find if user is registered for a different competition in same event
            const otherRegistered = !isRegistered
              ? competitions.find((c) => c.id !== competition.id && registeredMap[c.id])
              : undefined;
            return (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                eventSlug={eventSlug}
                isRegistered={isRegistered}
                registeredOtherName={otherRegistered?.name}
              />
            );
          })}
        </SimpleGrid>
      )}
    </Flex>
  );
}
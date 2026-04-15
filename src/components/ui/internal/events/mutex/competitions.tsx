"use client";

import React, { useEffect, useState } from "react";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import { Flex, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import CompetitionCard from "@/components/ui/internal/events/mutex/competition-card";
import { useWindowType } from "@/hooks/use-window-type";
import { getCompetitions, isUserRegisteredForCompetition, type ApiCompetition } from "@/api/competitions";
import { useAuth } from "@/atoms/auth";

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
  const [competitions, setCompetitions] = useState<ApiCompetition[]>([]);
  const [registeredMap, setRegisteredMap] = useState<Record<number, boolean>>({});
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

        // Check registration status for each competition
        if (userData?.id) {
          const userId = Number(userData.id);
          Promise.all(
            filtered.map((c) =>
              isUserRegisteredForCompetition(c.id, userId)
                .then((registered) => ({ id: c.id, registered }))
                .catch(() => ({ id: c.id, registered: false }))
            )
          ).then((results) => {
            if (cancelled) return;
            const map: Record<number, boolean> = {};
            results.forEach((r) => { map[r.id] = r.registered; });
            setRegisteredMap(map);
          }).finally(() => {
            if (!cancelled) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load competitions UI:", err);
        setError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId, userData?.id]);

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
              isRegistered={registeredMap[competition.id] ?? false}
            />
          ))}
        </SimpleGrid>
      )}
    </Flex>
  );
}
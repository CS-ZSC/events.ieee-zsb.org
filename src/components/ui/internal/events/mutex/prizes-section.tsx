"use client";

import React, { useEffect, useState } from "react";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { getCompetitionPrizes, type ApiPrize } from "@/api/competitions";
import SectionTitle from "@/components/ui/internal/section-title";
import SectionDescription from "@/components/ui/internal/section-description";
import SectionContainer from "@/components/ui/internal/events/mutex/section-container";
import AlternativeText from "@/components/ui/internal/alternative-text";

export default function PrizesSection({
  competitionId,
  description,
}: {
  competitionId: number;
  description: string;
}) {
  const [prizes, setPrizes] = useState<ApiPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!competitionId) return;
    let cancelled = false;
    getCompetitionPrizes(competitionId)
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => a.rank - b.rank);
        setPrizes(sorted);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load prizes UI:", err);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [competitionId]);

  const maxRank = prizes.length > 0 ? Math.max(...prizes.map((p) => p.rank)) || 1 : 1;

  const getRankColor = (rank: number) => {
    if (rank === 1) return "primary-1";
    if (rank === 2) return "primary-3";
    if (rank === 3) return "primary-11";
    return "primary-10";
  };

  const getRankLabel = (rank: number) => {
    if (rank === 1) return "1st place";
    if (rank === 2) return "2nd place";
    if (rank === 3) return "3rd place";
    return `${rank}th place`;
  };

  return (
    <SectionContainer>
      <SectionTitle title="Prizes" />
      <SectionDescription description={description} />

      {loading ? (
        <Spinner color="primary-1" size="xl" />
      ) : error ? (
        <Text color="red.400">Failed to load prizes.</Text>
      ) : prizes.length === 0 ? (
        <AlternativeText text="Stay tuned for prize announcements!" />
      ) : (
        <Flex flexWrap="wrap" justify="center" align="end" gap={8} mt={10}>
          {prizes.map((prize) => {
            const height = maxRank > 0
              ? ((maxRank - prize.rank + 1) / maxRank) * 400
              : 100;

            return (
              <Flex key={prize.id} direction="column" align="center">
                <Text
                  fontWeight="bold"
                  color="neutral-1"
                  fontSize="2xl"
                  mb={2}
                >
                  {prize.title}
                </Text>
                <Box
                  width="170px"
                  height={`${height}px`}
                  rounded="xl"
                  bg={getRankColor(prize.rank)}
                  transition="height 0.3s ease"
                />
                <Text color="neutral-2" mt={2}>
                  {getRankLabel(prize.rank)}
                </Text>
                {prize.prize_description && (
                  <Text color="neutral-3" fontSize="sm" mt={1} textAlign="center" maxW="170px">
                    {prize.prize_description}
                  </Text>
                )}
              </Flex>
            );
          })}
        </Flex>
      )}
    </SectionContainer>
  );
}
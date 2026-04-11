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
    getCompetitionPrizes(competitionId)
      .then(setPrizes)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [competitionId]);

  const maxAmount = prizes.length > 0
    ? Math.max(...prizes.map((p) => parseInt(p.amount.replace(/[^\d]/g, "")) || 0))
    : 1;

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
            const amount = parseInt(prize.amount.replace(/[^\d]/g, "")) || 0;
            const height = maxAmount > 0 ? (amount / maxAmount) * 400 : 100;

            let bgColor;
            if (prize.place === "1st") bgColor = "primary-1";
            else if (prize.place === "2nd") bgColor = "primary-3";
            else if (prize.place === "3rd") bgColor = "primary-11";
            else bgColor = "primary-10";

            return (
              <Flex key={prize.id} direction="column" align="center">
                <Text
                  fontWeight="bold"
                  color="neutral-1"
                  fontSize="2xl"
                  mb={2}
                >
                  {prize.amount}
                </Text>
                <Box
                  width="170px"
                  height={`${height}px`}
                  rounded="xl"
                  bg={bgColor}
                  transition="height 0.3s ease"
                />
                <Text color="neutral-2" mt={2}>
                  {prize.place} place
                </Text>
              </Flex>
            );
          })}
        </Flex>
      )}
    </SectionContainer>
  );
}

import React from "react";
import Link from "next/link";
import type { ApiCompetition } from "@/api/competitions";
import { getChapterLogo } from "@/api/competitions";
import { Flex, Stack, Text, Image } from "@chakra-ui/react";
import { FiCheck, FiUser, FiUsers } from "react-icons/fi";
import { useColorModeValue } from "@/components/ui/color-mode";

export default function CompetitionCard({
  competition,
  eventSlug,
  isRegistered = false,
  registeredOtherName,
}: {
  competition: ApiCompetition;
  eventSlug: string;
  isRegistered?: boolean;
  registeredOtherName?: string;
}) {
  const colorMode = useColorModeValue("light", "dark");
  const chapterLogo = getChapterLogo(competition.chapter_id, colorMode);
  const detailLink = `/events/${eventSlug}/competitions/${competition.id}`;

  return (
    <Flex flexDir="column" alignItems="center" gap={2} maxW="327px">
      <Text color="neutral-1" fontSize="xl" fontWeight="bold">
        {competition.name}
      </Text>
      <Link href={detailLink} style={{ textDecoration: "none", width: "100%" }}>
        <Stack
          w="full"
          align="center"
          justify="space-between"
          bgColor="primary-5"
          border="1px solid"
          borderColor="primary-3"
          rounded="2xl"
          gap={0}
          minH="438px"
          cursor="pointer"
          _hover={{ borderColor: "primary-1" }}
          transition="border-color 0.2s ease"
          overflow="hidden"
        >
          {/* Content area with padding */}
          <Flex flexDir="column" align="center" gap={4} px={4} pt={4} pb={3} flex={1} w="full">
            <Flex
              align="center"
              justify="center"
              flex={1}
              w="full"
              py={6}
            >
              <Image
                src={chapterLogo}
                alt={competition.name}
                maxW="200px"
                maxH="200px"
                objectFit="contain"
              />
            </Flex>
            <Text color="neutral-2" fontSize="lg">
              {competition.overview}
            </Text>
            {/* Clean text metadata */}
            <Flex align="center" gap={1.5} justify="center">
              {competition.type === "team" ? <FiUsers size={13} /> : <FiUser size={13} />}
              <Text color="neutral-3" fontSize="xs" fontWeight="500">
                {competition.type === "team" ? "Team" : "Individual"}
              </Text>
              {competition.type === "team" && competition.max_team_members > 0 && (
                <>
                  <Text color="neutral-4" fontSize="xs">·</Text>
                  <Text color="neutral-3" fontSize="xs" fontWeight="500">
                    Up to {competition.max_team_members} members
                  </Text>
                </>
              )}
            </Flex>
          </Flex>

          {/* Bottom status strip */}
          {registeredOtherName && !isRegistered ? (
            <Flex
              w="full"
              align="center"
              justify="center"
              gap={1.5}
              bg={{ _light: "rgba(0, 0, 0, 0.04)", _dark: "rgba(255, 255, 255, 0.05)" }}
              borderTop="1px solid"
              borderColor={{ _light: "rgba(0, 0, 0, 0.08)", _dark: "rgba(255, 255, 255, 0.08)" }}
              py={2.5}
              px={3}
            >
              <Text color="neutral-3" fontSize="xs" fontWeight="500">
                Registered for {registeredOtherName}
              </Text>
            </Flex>
          ) : isRegistered ? (
            <Flex
              w="full"
              align="center"
              justify="center"
              gap={2}
              bg={{ _light: "rgba(0, 102, 153, 0.08)", _dark: "rgba(0, 178, 255, 0.12)" }}
              borderTop="1px solid"
              borderColor={{ _light: "rgba(0, 102, 153, 0.2)", _dark: "rgba(0, 178, 255, 0.25)" }}
              py={2.5}
            >
              <FiCheck size={14} />
              <Text color="primary-1" fontSize="sm" fontWeight="600">Registered</Text>
            </Flex>
          ) : (
            <Flex
              w="full"
              align="center"
              justify="center"
              bg="primary-1"
              py={2.5}
            >
              <Text color="white" fontSize="sm" fontWeight="600">Join!</Text>
            </Flex>
          )}
        </Stack>
      </Link>
    </Flex>
  );
}

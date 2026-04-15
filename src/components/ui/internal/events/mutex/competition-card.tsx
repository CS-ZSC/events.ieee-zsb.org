import React from "react";
import Link from "next/link";
import type { ApiCompetition } from "@/api/competitions";
import { getChapterLogo } from "@/api/competitions";
import { Box, Flex, Stack, Text, Image } from "@chakra-ui/react";
import { FiCheck } from "react-icons/fi";

export default function CompetitionCard({
  competition,
  eventSlug,
  isRegistered = false,
}: {
  competition: ApiCompetition;
  eventSlug: string;
  isRegistered?: boolean;
}) {
  const chapterLogo = getChapterLogo(competition.chapter_id);
  const detailLink = `/events/${eventSlug}/${competition.id}`;

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
          padding={4}
          rounded="2xl"
          gap={4}
          minH="438px"
          cursor="pointer"
          _hover={{ borderColor: "primary-1" }}
          transition="border-color 0.2s ease"
        >
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
          <Flex
            as="span"
            align="center"
            justify="center"
            gap={2}
            bg={isRegistered ? "transparent" : "primary-1"}
            color={isRegistered ? "green.400" : "white"}
            borderWidth="2px"
            borderColor={isRegistered ? "green.400" : "transparent"}
            fontWeight="bold"
            rounded="10px"
            w="179px"
            px="25px"
            py="8px"
            textAlign="center"
            fontSize="18px"
          >
            {isRegistered && <FiCheck />}
            {isRegistered ? "Registered" : "Register now!"}
          </Flex>
        </Stack>
      </Link>
    </Flex>
  );
}

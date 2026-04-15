"use client";
import { Box, Flex, Heading, Text, Button, Stack } from "@chakra-ui/react";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import { useRouter } from "next/navigation";

export default function MyTickets() {
  const router = useRouter();

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
              You aren't registered in any event or competition
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
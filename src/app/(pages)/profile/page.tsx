"use client";
import { Box, Flex, Heading, Button, Stack, Link } from "@chakra-ui/react";
import { useAuth } from "@/atoms/auth";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MoonLoader } from "react-spinners";

export default function ProfileHome() {
  const userData = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !userData) {
    return (
      <PageWrapper>
        <Flex justify="center" align="center" h="60vh">
           <MoonLoader color="#006699" />
        </Flex>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Flex direction="column" align="center" justify="center" h="60vh" gap={6}>
        <Heading size="3xl" color="neutral-1">
          Welcome <Box as="span" fontWeight="normal">{userData.name}</Box>
        </Heading>
        
        <Flex gap={4} mt={4}>
          <Button bg="primary-10" color="white" px={8} py={6} borderRadius="xl" onClick={() => router.push("/profile/edit")}>
            Edit my account
          </Button>
          <Button bg="primary-10" color="white" px={8} py={6} borderRadius="xl" onClick={() => router.push("/profile/tickets")}>
            See my tickets
          </Button>
        </Flex>

        <Flex gap={6} mt={2}>
          <Link onClick={() => router.push("/auth/logout")} color="neutral-2" fontSize="sm" textDecoration="underline" cursor="pointer">Logout</Link>
          <Link color="red.500" fontSize="sm" textDecoration="underline" cursor="pointer">Delete my account</Link>
        </Flex>
      </Flex>
    </PageWrapper>
  );
}
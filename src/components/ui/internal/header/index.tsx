"use client";

import React from "react";
import { Box, Flex, HStack, Heading, Button } from "@chakra-ui/react";
import { useWindowType } from "@/hooks/use-window-type";
import { ColorModeButton, useColorModeValue } from "../../color-mode";
import dynamic from "next/dynamic";
import { MoonLoader } from "react-spinners";
import { useAuth } from "@/atoms/auth"; 
import Profile from "./profile"; 
import { useRouter } from "next/navigation"; 

const Logo = dynamic(() => import("@/components/ui/internal/logo"), {
  loading: () => <MoonLoader size={10} />,
});

export default function Header() {
  const { isDesktop } = useWindowType();
  const logoType = useColorModeValue("black", "white");
  const userData = useAuth(); 
  const router = useRouter(); 

  return (
    <Flex justify="center" align="center" marginY={16}>
      <Box
        p={5}
        as="nav"
        position="fixed"
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        height="20"
        maxWidth="min(3000px, calc(100% - 2 * var(--global-spacing)))"
        width="full"
        minWidth="200px"
        boxShadow="lg"
        bgColor={"primary-5"}
        color={"neutral-1"}
        border="1px solid"
        borderColor="primary-3"
        borderRadius="2xl"
        backdropFilter="blur(16px)"
        top={"var(--global-spacing)"}
        zIndex={5}
      >
        <HStack justifyContent="space-between" alignItems="center" width="full">
          <HStack>
            <Flex
              align={"center"}
              justify={"center"}
              pr={2}
              borderRightColor={"neutral-1"}
              borderRightWidth={isDesktop ? 1 : 0}
            >
              <Logo width={85} height={50} type={logoType} />
            </Flex>
            {isDesktop && <Heading>Events and Competitions</Heading>}
          </HStack>
          <HStack spaceX={4} alignItems="center">
            {
              !userData ? (
                <Button
                  variant="outline"
                  width={"fit-content"} 
                  bgColor={"primary-1"}
                  rounded="xl"
                  padding={"10px 20px"}
                  justifyContent={"center"}
                  textAlign="center"
                  color="white"
                  transition="all"
                  _hover={{ backgroundColor: "primary-10" }}
                  size={isDesktop ? "xl" : "md"}
                  onClick={() => router.push("/auth/login")} 
                >
                  Login
                </Button>
              ) : (
                <Profile /> 
              )
            }
            <ColorModeButton />
          </HStack>
        </HStack>
      </Box>
    </Flex>
  );
}
"use client";

import React from "react";
import { Flex, Text, Button } from "@chakra-ui/react"; 
import ImageBox from "@/components/ui/internal/image-box";
import NavButton from "@/components/ui/internal/nav-button";
import { useWindowType } from "@/hooks/use-window-type";
import { FiUserPlus, FiUserMinus } from "react-icons/fi";

interface HeroSectionProps {
  title: string;
  description: string;
  imagePath: string;
  imageAlt?: string;
  buttonLink?: string;
  onRegisterClick?: () => void;
  isRegistered?: boolean;
  isLoading?: boolean;
  ruleBook?: string;
}

export default function HeroSection({
  title,
  description,
  imagePath,
  imageAlt = "Event Image",
  buttonLink,
  onRegisterClick,
  isRegistered,
  isLoading,
  ruleBook,
}: HeroSectionProps) {
  const { isMobile } = useWindowType();

  return (
    <Flex
      flexWrap="wrap"
      justifyContent="space-between"
      alignItems="center"
      flexDirection="row-reverse"
      gap={6}
      width="100%"
    >
      <ImageBox
        path={imagePath}
        alt={imageAlt}
        maxWidth="600px"
        mx={isMobile ? "auto" : "0"}
      />
      <Flex
        flexDir={"column"}
        maxWidth="600px"
        gap={4}
        mx={isMobile ? "auto" : "0"}
        justifyContent={isMobile ? "center" : "flex-start"}
        alignItems={isMobile ? "center" : "flex-start"}
      >
        <Text fontSize={"4xl"} color={"neutral-1"} fontWeight={"bold"}>
          {title}
        </Text>
        <Text color={"neutral-2"} whiteSpace={"pre-line"}>
          {description}
        </Text>
        <Flex gap={4} flexWrap="wrap">
          
          {onRegisterClick ? (
            <Button
              onClick={onRegisterClick}
              loading={isLoading}
              bg={isRegistered ? "transparent" : "primary-1"}
              color={isRegistered ? "red.400" : "white"}
              borderWidth="2px"
              borderColor={isRegistered ? "red.400" : "transparent"}
              _hover={{
                bg: isRegistered ? "red.600" : "primary-2",
                color: "white",
                borderColor: isRegistered ? "red.600" : "transparent",
              }}
              w="179px"
              px="25px"
              py="8px"
              borderRadius="10px"
              fontSize="18px" 
              fontWeight="bold"
              transition="all 0.2s ease"
            >
              {isRegistered ? <FiUserMinus /> : <FiUserPlus />}
              {isRegistered ? "Unregister" : "Register Now!"}
            </Button>
          ) : buttonLink ? (
            <NavButton link={buttonLink} text="Register Now!" />
          ) : null}

          {ruleBook && (
            <NavButton
              link={ruleBook}
              text="View Rule-book"
              bgColor="primary-8"
              color="neutral-5"
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
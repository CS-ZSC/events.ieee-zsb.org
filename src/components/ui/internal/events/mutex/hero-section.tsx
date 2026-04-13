"use client";

import React from "react";
import { Flex, Text, Button } from "@chakra-ui/react"; 
import ImageBox from "@/components/ui/internal/image-box";
import NavButton from "@/components/ui/internal/nav-button";
import { useWindowType } from "@/hooks/use-window-type";

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
        justifyContent={isMobile ? "center" : "left"}
        alignItems={isMobile ? "center" : "left"}
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
              isLoading={isLoading}
              bg={isRegistered ? "red.600" : "primary-1"}
              color="white"
              _hover={{ bg: isRegistered ? "red.700" : "primary-2" }}
              px={8}
              py={6}
              borderRadius="15px" 
              fontWeight="bold"
            >
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
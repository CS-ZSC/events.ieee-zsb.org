"use client";

import React, { useEffect, useState } from "react";
import { sections } from "./sections";
import {
  Stack,
  Heading,
  Box,
  SimpleGrid,
  Flex,
  Text,
  Grid,
} from "@chakra-ui/react";
import Link from "next/link";
import Logo from "@/components/ui/internal/logo";
import Card from "@/components/ui/internal/card";
import { useWindowType } from "@/hooks/use-window-type";
import SocialMediaLinks from "@/data/social-media-links";
import { Icon } from "@iconify/react";
import { useIsAuthenticated } from "@/atoms/auth";

export default function Footer() {
  const { isDesktop } = useWindowType();
  const isAuth = useIsAuthenticated();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Flex paddingTop="var(--global-spacing)">
      <Card>
        <Logo
          width={isDesktop ? 180 : 110}
          height={isDesktop ? 110 : 65}
        />
        <SimpleGrid
          columns={2}
          justifyContent={"center"}
          w="full"
          gapX={3}
          gapY={10}
          paddingX={isDesktop ? 10 : 0}
        >
          {sections.map((section, i) => (
            <Stack key={i} align={isDesktop || i % 2 == 1 ? "center" : "start"}>
              <Stack>
                <Heading color={"neutral-1"} marginBottom={1}>
                  {section.title}
                </Heading>
                {section.links.filter(e => {
                  if (e.authHandler) {
                    return e.authHandler(isAuth);
                  }
                  return true;
                }).map((link, i) => (
                  <Box
                    key={i}
                    color={"neutral-2"}
                    _hover={{ color: "neutral-1" }}
                    transition="opacity 0.2s ease-in-out"
                    width={"fit-content"}
                  >
                    <Link href={link.href}>{link.name}</Link>
                  </Box>
                ))}
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>
        <Stack>
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
            gapX={6}
            gapY={3}
            alignItems="center"
            marginBottom={2}
          >
            <Heading textAlign="center" color={"neutral-1"}>
              Follow Us
            </Heading>
            <Heading textAlign="center" color={"neutral-1"}>
              Contact Us
            </Heading>
            <Flex
              justifyContent="center"
              gap={3}
              gridRow={{ base: 2, md: "auto" }}
            >
              {SocialMediaLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                >
                  <MediaLinks icon={link.icon} />
                </Link>
              ))}
            </Flex>
            <Flex
              justifyContent="center"
              alignItems="center"
              gridRow={{ base: 4, md: "auto" }}
              transition="opacity 0.2s ease-in-out"
              color={"neutral-2"}
              _hover={{ color: "neutral-1" }}
            >
              <Link href="mailto:info@ieee-zsb.org">info@ieee-zsb.org</Link>
            </Flex>
          </Grid>

          <Text textAlign={"center"} color={"neutral-2"}>
            Designed and developed by Our Technical Dev Team &copy;{" "}
            {new Date().getFullYear()}
          </Text>
          <Text textAlign={"center"} color={"neutral-2"}>
            All rights reserved to IEEE Zagazig SB
          </Text>
        </Stack>
      </Card>
    </Flex>
  );
}

function MediaLinks({ icon }: { icon: string }) {
  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      padding={1}
      borderRadius={10}
      transition="all"
      color="neutral-2"
      _hover={{ color: "neutral-1" }}
    >
      <Icon icon={icon} width={35} height={35} />
    </Flex>
  );
}

import { Image, Box, Center, Text } from "@chakra-ui/react";
import React from "react";

interface ImageBoxProps {
  path: string;
  alt: string | undefined;
  maxWidth?: string;
  aspectRatio?: string;
  mx?: string;
  roundedBottom?: string;
}

export default function ImageBox({
  path,
  alt = "Photo",
  maxWidth = "850px",
  aspectRatio = "16/9",
  mx = "auto",
  roundedBottom = "2xl",
}: ImageBoxProps) {
  // Check if the path is empty. If it is, we don't render the Image tag at all
  // to prevent the Next.js empty string error. Instead, we render a placeholder Box.
  if (!path || path.trim() === "") {
    return (
      <Center
        width="full"
        maxWidth={maxWidth}
        mx={mx}
        position="relative"
        border="1px solid"
        borderColor="primary-3"
        rounded="2xl"
        roundedBottom={roundedBottom}
        bg="gray.100"
        style={{
          aspectRatio: aspectRatio,
        }}
      >
        <Text color="gray.400" fontWeight="bold">
          Image Coming Soon
        </Text>
      </Center>
    );
  }

  // If the path is valid, render the actual image
  return (
    <Image
      src={path}
      alt={alt}
      width="full"
      maxWidth={maxWidth}
      mx={mx}
      position="relative"
      objectFit="cover"
      border="1px solid"
      borderColor="primary-3"
      rounded="2xl"
      roundedBottom={roundedBottom}
      loading="lazy"
      style={{
        aspectRatio: aspectRatio,
      }}
    />
  );
}

import React from "react";
import { Text } from "@chakra-ui/react";

export default function SectionDescription({
  description,
}: {
  description: string;
}) {
  return (
    <Text color={"neutral-2"} px={4}>
      {description}
    </Text>
  );
}

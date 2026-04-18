"use client";

import React from "react";
import { Flex, Text } from "@chakra-ui/react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <Flex align="center" gap={2} flexWrap="wrap" mb={2}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <Text fontSize="sm" color="neutral-3" userSelect="none">
                /
              </Text>
            )}
            {item.href && !isLast ? (
              <Link href={item.href}>
                <Text
                  fontSize="sm"
                  color="primary-2"
                  _hover={{ textDecoration: "underline" }}
                  cursor="pointer"
                >
                  {item.label}
                </Text>
              </Link>
            ) : (
              <Text fontSize="sm" color="neutral-3">
                {item.label}
              </Text>
            )}
          </React.Fragment>
        );
      })}
    </Flex>
  );
}

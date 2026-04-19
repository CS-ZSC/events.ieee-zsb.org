"use client";

import React, { useState } from "react";
import Card from "@/components/ui/internal/card";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import Breadcrumb from "@/components/ui/internal/breadcrumb";
import Input from "@/components/ui/internal/input";
import AuthButton from "@/components/ui/internal/auth-button";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("New password:", password);
  }

  return (
    <>
    <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Profile", href: "/profile" }, { label: "Reset Password" }]} />
    <Flex justify="center" w="full" h="fit-content" minH="80vh" align="center">
      <Box maxW="720px" w="full" h="fit-content">
        <Card>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <Stack w="full" gap={5} align="center" justify="center">
              <Text color="neutral-1" fontSize="1.5rem">
                Enter a new password
              </Text>
              <Stack w="full" alignItems="center">
                <Input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  placeholder="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Stack>
              <AuthButton text="Confirm" />
            </Stack>
          </form>
        </Card>
      </Box>
    </Flex>
    </>
  );
}

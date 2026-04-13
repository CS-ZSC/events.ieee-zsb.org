"use client";

import React from "react";
import { useForm } from "react-hook-form";
import Card from "@/components/ui/internal/card";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import Input from "@/components/ui/internal/input";
import AuthButton from "@/components/ui/internal/auth-button";
import { sendPasswordResetCode } from "@/api/auth";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

type ForgotPasswordFormData = {
  email: string;
};

export default function ForgotPassword() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const res = await sendPasswordResetCode(data);

    if (res.success) {
      toaster.success({
        closable: true,
        title: "Code Sent!",
        description: "Check your email for the reset code.",
        duration: 5000,
      });
      router.push(
        `/auth/reset-password?email=${encodeURIComponent(data.email)}`,
      );
    } else {
      toaster.error({
        closable: true,
        title: "Failed",
        description: res.message,
        duration: 5000,
      });
    }
  };

  return (
    <Flex justify="center" w="full" h="full" align="center">
      <Box maxW="720px" w="full" h="fit-content">
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <Stack w="full" gap={5} align="center" justify="center">
              <Text color="neutral-1" fontSize="2rem">
                Forgot Password
              </Text>
              <Text color="neutral-3" fontSize="0.9rem" textAlign="center">
                Enter your email and we&apos;ll send you a reset code.
              </Text>

              <Stack w="full" alignItems="center">
                <Input
                  label="Email Address"
                  placeholder="example@domain.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              </Stack>

              <AuthButton
                text="Send Reset Code"
                loading={isSubmitting}
                loadingText="Sending..."
              />
            </Stack>
          </form>
        </Card>
      </Box>
    </Flex>
  );
}

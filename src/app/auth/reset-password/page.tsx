"use client";

import React from "react";
import { useForm } from "react-hook-form";
import Card from "@/components/ui/internal/card";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import Input from "@/components/ui/internal/input";
import AuthButton from "@/components/ui/internal/auth-button";
import PasswordInput from "@/components/ui/internal/password-input";
import { resetPassword } from "@/api/auth";
import { toaster } from "@/components/ui/toaster";
import { redirect, useSearchParams } from "next/navigation";

type ResetPasswordFormData = {
  code: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    const res = await resetPassword({
      email,
      verification_code: data.code,
      password: data.newPassword,
      password_confirmation: data.confirmPassword,
    });

    if (res.success) {
      toaster.success({
        closable: true,
        title: "Password Reset!",
        description: "Your password has been changed. Please login.",
        duration: 5000,
      });
      redirect("/auth/login");
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
                Reset Password
              </Text>
              <Text color="neutral-3" fontSize="0.9rem" textAlign="center">
                Enter the code sent to{" "}
                <Text as="span" color="neutral-1" fontWeight="bold">
                  {email}
                </Text>
              </Text>

              <Stack w="full" alignItems="center">
                <Input
                  label="Verification Code"
                  placeholder="Enter the code you received"
                  {...register("code", {
                    required: "Code is required",
                  })}
                  isInvalid={!!errors.code}
                  errorMessage={errors.code?.message}
                />
                <PasswordInput
                  label="New Password"
                  placeholder="Enter your new password"
                  {...register("newPassword", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/,
                      message:
                        "Password must contain uppercase, lowercase, and special character",
                    },
                  })}
                  isInvalid={!!errors.newPassword}
                  errorMessage={errors.newPassword?.message}
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val) =>
                      watch("newPassword") === val || "Passwords do not match",
                  })}
                  isInvalid={!!errors.confirmPassword}
                  errorMessage={errors.confirmPassword?.message}
                />
              </Stack>

              <AuthButton
                text="Reset Password"
                loading={isSubmitting}
                loadingText="Resetting..."
              />
            </Stack>
          </form>
        </Card>
      </Box>
    </Flex>
  );
}

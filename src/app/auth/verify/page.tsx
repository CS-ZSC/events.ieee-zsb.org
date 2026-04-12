"use client";

import React from "react";
import { useForm } from "react-hook-form";
import Card from "@/components/ui/internal/card";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import Input from "@/components/ui/internal/input";
import AuthButton from "@/components/ui/internal/auth-button";
import { verifyRegistration } from "@/api/auth";
import { useSetAtom } from "jotai";
import { userDataAtom, UserData } from "@/atoms/auth";
import { toaster } from "@/components/ui/toaster";
import { redirect, useSearchParams } from "next/navigation";

type VerifyFormData = {
  code: string;
};

export default function Verify() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const setUserData = useSetAtom(userDataAtom);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormData>({
    defaultValues: { code: "" },
  });

  const onSubmit = async (data: VerifyFormData) => {
    const res = await verifyRegistration({ email, code: data.code });

    if (res.success) {
      const userData: UserData = {
        email: res.email,
        id: res.id,
        inviteUserToken: res.inviteUserToken,
        name: res.name,
        profileImageURL: res.profileImageURL,
        token: res.token,
      };
      setUserData(userData);

      toaster.success({
        closable: true,
        title: "Email Verified!",
        description: "Your account is ready. Welcome!",
        duration: 5000,
      });

      redirect("/");
    } else {
      toaster.error({
        closable: true,
        title: "Verification Failed",
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
                Verify Your Email
              </Text>
              <Text color="neutral-3" fontSize="0.9rem" textAlign="center">
                We sent a verification code to{" "}
                <Text as="span" color="neutral-1" fontWeight="bold">
                  {email}
                </Text>
              </Text>

              <Stack w="full" alignItems="center">
                <Input
                  label="Verification Code"
                  placeholder="Enter the code you received"
                  {...register("code", {
                    required: "Verification code is required",
                  })}
                  isInvalid={!!errors.code}
                  errorMessage={errors.code?.message}
                />
              </Stack>

              <AuthButton
                text="Verify Email"
                loading={isSubmitting}
                loadingText="Verifying..."
              />

              <Text color="neutral-3" fontSize="0.9rem" textAlign="center">
                Didn&apos;t receive the code? Check your spam folder.
              </Text>
            </Stack>
          </form>
        </Card>
      </Box>
    </Flex>
  );
}

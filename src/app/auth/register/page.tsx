"use client";

import React from "react";
import { useForm } from "react-hook-form";
import Card from "@/components/ui/internal/card";
import { Box, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import Input from "@/components/ui/internal/input";
import AuthButton from "@/components/ui/internal/auth-button";
import Link from "next/link";
import FileUpload from "@/components/ui/internal/auth/file-upload";
import { toaster } from "@/components/ui/toaster";
import PasswordInput from "@/components/ui/internal/password-input";
import { RegisterData, registerUser } from "@/api/auth";
import AvatarUpload from "@/components/ui/internal/auth/avatar-upload";
import { redirect } from "next/navigation";

type RegisterFormData = {
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  password: string;
  confirmPassword: string;
  idFrontImage: File | null;
  idBackImage: File | null;
  profileImage: File | null;
};

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      nationalId: "",
      password: "",
      confirmPassword: "",
      idFrontImage: null,
      idBackImage: null,
      profileImage: null,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    const requestData: RegisterData = {
      name: data.fullName,
      email: data.email,
      phone_number: data.phone,
      national_id: data.nationalId,
      password: data.password,
      password_confirmation: data.confirmPassword,
    };

    const res = await registerUser(requestData);

    if (res.success) {
      toaster.success({
        closable: true,
        title: "Registration Successful",
        description: "Check your email for the verification code.",
        duration: 10000,
      });
      redirect(`/auth/verify?email=${encodeURIComponent(data.email)}`);
    } else {
      toaster.error({
        closable: true,
        title: "Registration Failed",
        description: res.message,
        duration: 10000,
      });
    }
  };

  return (
    <Flex justify="center" w="full" h="fit-content" minH="80vh" align="center">
      <Box maxW="720px" w="full" h="fit-content">
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <Stack w="full" gap={5} align="center" justify="center">
              <Text color="neutral-1" fontSize="2rem">
                Register
              </Text>

              <Stack w="full" alignItems="center">
                <Box textAlign="center" mb={4}>
                  <AvatarUpload
                    label="Profile Picture"
                    value={watch("profileImage")}
                    setFile={(file) => setValue("profileImage", file)}
                    isRequired
                    isInvalid={!!errors.profileImage}
                    errorMessage={errors.profileImage?.message}
                  />
                </Box>

                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  })}
                  isInvalid={!!errors.fullName}
                  errorMessage={errors.fullName?.message}
                />

                <Input
                  label="Email Address"
                  placeholder="example@domain.com"
                  type="email"
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

                <Input
                  label="Phone Number"
                  placeholder="Enter your WhatsApp number"
                  type="tel"
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Invalid phone number",
                    },
                    maxLength: {
                      value: 11,
                      message: "Phone number cannot be more than 11 digits",
                    },
                    minLength: {
                      value: 11,
                      message: "Phone number cannot be less than 11 digits",
                    },
                  })}
                  isInvalid={!!errors.phone}
                  errorMessage={errors.phone?.message}
                />

                <Input
                  label="National ID"
                  placeholder="Enter your 14-digit national ID"
                  {...register("nationalId", {
                    required: "National ID is required",
                    pattern: {
                      value:
                        /^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(0[1-9]|[12]\d|3[01])\d{5}$/,
                      message: "Please enter a valid Egyptian National ID",
                    },
                    maxLength: {
                      value: 14,
                      message: "National ID must be 14 digits",
                    },
                    minLength: {
                      value: 14,
                      message: "National ID must be 14 digits",
                    },
                  })}
                  isInvalid={!!errors.nationalId}
                  errorMessage={errors.nationalId?.message}
                />

                <HStack w="fit" align="start" justify={"center"} spaceX={8}>
                  <FileUpload
                    label="ID Front Card"
                    setFile={(file) => setValue("idFrontImage", file)}
                    isRequired
                    isInvalid={!!errors.idFrontImage}
                    errorMessage={errors.idFrontImage?.message}
                  />
                  <FileUpload
                    label="ID Back Card"
                    setFile={(file) => setValue("idBackImage", file)}
                    isRequired
                    isInvalid={!!errors.idBackImage}
                    errorMessage={errors.idBackImage?.message}
                  />
                </HStack>

                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  {...register("password", {
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
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
                />

                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val: string) =>
                      watch("password") === val || "Passwords do not match",
                  })}
                  isInvalid={!!errors.confirmPassword}
                  errorMessage={errors.confirmPassword?.message}
                />
              </Stack>

              <AuthButton
                text="Create an account"
                loading={isSubmitting}
                loadingText="Registering..."
              />

              <Stack>
                <Text color="neutral-3" fontSize="0.8rem" textAlign="center">
                  Your data is securely encrypted and protected. We take your
                  privacy seriously.
                </Text>
                <Text color="neutral-3" fontSize="0.8rem" mt="-2">
                  Why National ID? National ID is required by the university for
                  verification purposes.
                </Text>
              </Stack>

              <Flex
                w="full"
                alignItems="center"
                color="neutral-3"
                justify="center"
                gapX={10}
                gapY={5}
                flexWrap="wrap"
              >
                <Link href="/auth/login">
                  <Text textDecoration="underline">
                    Already have an account? Login
                  </Text>
                </Link>
              </Flex>
            </Stack>
          </form>
        </Card>
      </Box>
    </Flex>
  );
}

"use client";

import React, { useRef } from "react";
import { InputProps, Input as ChakraInput, InputGroup, IconButton, Field, HStack } from "@chakra-ui/react";
import { LuEye, LuEyeOff } from "react-icons/lu";

export default function PasswordInput({
  placeholder,
  isInvalid,
  errorMessage,
  label,
  ...props
}: InputProps & {
  errorMessage?: string;
  label?: string;
  isInvalid: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Field.Root invalid={isInvalid} maxW={"400px"} w={"full"}>
      <HStack justifyContent="space-between" w="full">
        {label && <Field.Label>{label}</Field.Label>}
        {errorMessage && <Field.ErrorText ml={4} color={"red.400"}>{errorMessage}</Field.ErrorText>}
      </HStack>
      <InputGroup w={"full"}

        endElement={
          <IconButton
            me="-2"
            aspectRatio="square"
            size="sm"
            height="calc(100% - {spacing.2})"
            aria-label="Toggle password visibility"
            bg="primary-12"
            color="neutral-1"
            border={"1px"}
            borderColor="primary-3"
            borderRadius={"9px"}
            _hover={{ opacity: 80 }}
            onClick={() => { setShowPassword(!showPassword); ref.current?.focus(); }}
          >
            {showPassword ? <LuEyeOff /> : <LuEye />}
          </IconButton>

        }
      >
        <ChakraInput
          ref={ref}
          placeholder={placeholder}
          borderRadius="10px"
          type={showPassword ? "text" : "password"}
          border="1px solid"
          borderColor="primary-3"
          bg="primary-12"
          color="neutral-2"
          padding="var(--global-spacing)"
          fontSize={"0.9rem"}
          outline={"none"}
          transition={"all 0.2s ease-in-out"}
          _focus={{
            borderColor: "primary-2",
            boxShadow: "0 0 0 1px primary-4",
          }}
          _placeholder={{
            color: "neutral-3",
          }}
          {...props}
        />
      </InputGroup>
    </Field.Root>
  );
}

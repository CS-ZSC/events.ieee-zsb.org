import { useState } from "react";
import { VStack, Flex, Box, Heading, Text } from "@chakra-ui/react";
import BackButton from "../back-button";
import CustomButton from "../custom-button";
import { toaster } from "@/components/ui/toaster";
import { checkEventRegistration, ensureEventRegistration } from "@/api/competitions";

interface Props {
  handleBack: () => void;
  handleNext: () => void;
  eventSlug: string;
}

export default function Step2Attendee({ handleBack, handleNext, eventSlug }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    try {
      const eventStatus = await checkEventRegistration(eventSlug);
      if (!eventStatus.registered) {
        await ensureEventRegistration(eventSlug, "spectator");
      }
      toaster.success({
        closable: true,
        title: "Registered!",
        description: "You have been registered as an attendee.",
        duration: 3000,
      });
      handleNext();
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        // Already registered — treat as success
        handleNext();
        return;
      }
      const message = err.response?.data?.message || "Registration failed. Please try again.";
      toaster.error({
        closable: true,
        title: "Registration Failed",
        description: message,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack color="neutral-1" gap={6} position="relative">
      <Flex
        justifyContent="center"
        alignItems="center"
        width="100%"
        position="relative"
      >
        <Box position="absolute" left={0}>
          <BackButton handleBack={handleBack} />
        </Box>
        <Box>
          <Heading size="md" textAlign="center">
            Register as an attendee?
          </Heading>
        </Box>
      </Flex>
      <Text color="neutral-2">
        After you register, a ticket will appear in your profile. You can still
        cancel and delete the ticket later.
      </Text>
      <CustomButton
        label="Register"
        onClick={handleRegister}
        loading={loading}
        loadingText="Registering..."
      />
    </VStack>
  );
}

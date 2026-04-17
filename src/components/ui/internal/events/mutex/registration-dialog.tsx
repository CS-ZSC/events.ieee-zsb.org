"use client";

import { Dialog, Portal, VStack, Button } from "@chakra-ui/react";
import { useWindowType } from "@/hooks/use-window-type";
import { Icon } from "@iconify/react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function RegistrationDialog({ open, onClose, title, children }: Props) {
  const { isMobile } = useWindowType();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => { if (!e.open) onClose(); }}
      size={isMobile ? "full" : "md"}
      placement="center"
      closeOnInteractOutside={false}
      closeOnEscape={true}
    >
      <Portal>
        <Dialog.Backdrop
          bg="blackAlpha.700"
          backdropFilter="blur(8px)"
        />
        <Dialog.Positioner>
          <Dialog.Content
            bg="primary-5"
            border="1px solid"
            borderColor="primary-3"
            borderRadius={isMobile ? "0" : "10px"}
            color="neutral-1"
            p={6}
            maxH={isMobile ? "100vh" : "85vh"}
            overflowY="auto"
            minH={isMobile ? "100vh" : "auto"}
          >
            <Dialog.Header p={0} mb={4}>
              <VStack align="stretch" gap={3} w="100%">
                <Button
                  alignSelf="flex-start"
                  bg="transparent"
                  color="neutral-1"
                  _hover={{ bg: "rgba(255,255,255,0.05)" }}
                  onClick={onClose}
                  p={1}
                  minW="auto"
                  fontSize="sm"
                >
                  <Icon icon="mdi:arrow-left" width={20} height={20} />
                  Back
                </Button>
                <Dialog.Title fontSize="lg" fontWeight="bold" textAlign="center">
                  {title}
                </Dialog.Title>
              </VStack>
            </Dialog.Header>
            <Dialog.Body p={0}>
              {children}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

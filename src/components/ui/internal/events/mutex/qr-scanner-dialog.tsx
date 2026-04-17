"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Flex, Text, Button, Box, Portal } from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react";
import { Icon } from "@iconify/react";

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
  title?: string;
}

export default function QrScannerDialog({ open, onClose, onScan, title = "Scan QR Code" }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !scannerRef.current) return;

        const scannerId = "qr-scanner-region";

        // Ensure the container element exists
        if (!document.getElementById(scannerId)) {
          const el = document.createElement("div");
          el.id = scannerId;
          scannerRef.current.appendChild(el);
        }

        const scanner = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScanRef.current(decodedText);
            scanner.stop().catch(() => {});
            onCloseRef.current();
          },
          () => {
            // ignore scan failures (no QR in frame)
          }
        );

        if (mounted) setScanning(true);
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Camera access denied or not available.");
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
      setScanning(false);
      setError(null);
    };
  }, [open]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => { if (!e.open) onClose(); }}
      size="sm"
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="primary-5"
            border="1px solid"
            borderColor="#005481"
            borderRadius="10px"
            color="neutral-1"
            p={6}
          >
            <Flex flexDir="column" gap={4} align="center">
              <Dialog.Title fontSize="lg" fontWeight="bold" color="neutral-1">
                {title}
              </Dialog.Title>

              <Box
                ref={scannerRef}
                w="100%"
                minH="280px"
                rounded="md"
                overflow="hidden"
                bg="black"
              />

              {error && (
                <Flex align="center" gap={2} bg="red.950" border="1px solid" borderColor="red.700" rounded="lg" px={4} py={3} w="100%">
                  <Icon icon="mdi:alert-circle" width={18} color="var(--chakra-colors-red-400)" />
                  <Text color="red.300" fontSize="sm">{error}</Text>
                </Flex>
              )}

              <Button
                w="100%"
                bg="transparent"
                color="neutral-2"
                borderWidth="2px"
                borderColor="primary-3"
                _hover={{ bg: "primary-4" }}
                borderRadius="8px"
                fontWeight="bold"
                onClick={onClose}
              >
                Cancel
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

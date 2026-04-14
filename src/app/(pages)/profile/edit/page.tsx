"use client";
import { Box, Flex, Heading, Button, Stack, Input, Text, Avatar } from "@chakra-ui/react";
import { useAuth } from "@/atoms/auth";
import PageWrapper from "@/components/ui/internal/page-wrapper";
import { MdOutlineContentCopy } from "react-icons/md";

export default function EditProfile() {
  const userData = useAuth();

  return (
    <PageWrapper>
      <Flex direction="column" align="center" py={10}>
        <Heading mb={10} color="neutral-1">Edit my account</Heading>
        
        <Box bg="primary-5" backdropFilter="blur(16px)" p={10} borderRadius="3xl" border="1px solid" borderColor="primary-3" width="full" maxWidth="900px">
          <Flex gap={10} flexWrap="wrap">
            {/* Left Side: Info */}
            <Box flex={1} minW="300px">
              <Stack gap={4}>
                <Heading size="md" color="neutral-1">Edit your account information</Heading>
                <Text color="neutral-2" fontSize="sm">
                  You can edit your name, phone number, national id and your password. <br />
                  You can't edit your id: <Box as="span" color="primary-8" fontWeight="bold">ieee#0000001</Box>
                </Text>
                <Flex gap={4} mt={6}>
                   <Button bg="primary-1" color="white" px={8}>Save my edits</Button>
                   <Button variant="outline" borderColor="primary-1" color="primary-1" px={8}>Cancel</Button>
                </Flex>
              </Stack>
            </Box>

            {/* Right Side: Form */}
            <Stack flex={1} gap={4} minW="300px">
                <Flex align="center" gap={4} mb={4}>
                    <Avatar.Root size="xl" border="2px solid" borderColor="accent-1">
                        <Avatar.Image src={userData?.profileImageURL} />
                    </Avatar.Root>
                    <Box>
                        <Text color="neutral-3" fontSize="xs">User ID: ieee#0000001 <MdOutlineContentCopy style={{displayInline: 'inline'}} /></Text>
                    </Box>
                </Flex>
                <Input defaultValue={userData?.name} bg="primary-10" border="none" color="neutral-1" p={6} />
                <Input placeholder="New Password" type="password" bg="primary-10" border="none" p={6} />
                <Input defaultValue={userData?.email} bg="primary-10" border="none" p={6} />
                <Input defaultValue="+201022474665" bg="primary-10" border="none" p={6} />
            </Stack>
          </Flex>
        </Box>
      </Flex>
    </PageWrapper>
  );
}
import { useAuth } from "@/atoms/auth";
import Card from "../card";
import { Avatar, Box, Button, Clipboard, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { toaster } from "../../toaster";
import { useEffect, useRef, useState } from "react";
import { useWindowType } from "@/hooks/use-window-type";
import { redirect } from "next/navigation";
import { MdOutlineEmail, MdOutlineKey } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";

export default function Profile() {
    const userData = useAuth();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { isDesktop } = useWindowType();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (userData === null)
        return <Box display={"none"} />

    return (
        <Box position={"relative"} w="full" ref={containerRef}>
            <Avatar.Root 
                size={"xl"} 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                <Avatar.Fallback name={userData.name} />
                <Avatar.Image src={userData.profileImageURL || undefined} />
            </Avatar.Root>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: "absolute",
                            zIndex: 100,
                            right: "-20px",
                            top: "70px",
                            width: "100%",
                            maxWidth: isDesktop ? "450px" : "95vw",
                            minWidth: isDesktop ? "450px" : "95vw"
                        }}
                    >
                        <Card gap={2} backDropFilter={"blur(16px)"}>
                            <HStack w="full" justify={"start"} spaceX={8}>
                                <Avatar.Root size="2xl">
                                    <Avatar.Fallback name={userData.name} />
                                    <Avatar.Image src={userData.profileImageURL || undefined} />
                                </Avatar.Root>
                                <Stack spaceY={-2}>
                                    <Heading size="xl" fontWeight={"bold"}>{userData.name}</Heading>
                                    <HStack color="neutral-3">
                                        <MdOutlineEmail size={20} />
                                        <Text overflow={"hidden"}>
                                            {userData.email}
                                        </Text>
                                    </HStack>
                                    <Clipboard.Root value={userData.inviteUserToken} timeout={1000} onStatusChange={(e) => {
                                        if (e.copied)
                                            toaster.create({
                                                type: "success",
                                                title: "Invite token Copied!",
                                                description: `Your invite token (${userData.inviteUserToken}) has been copied to your clipboard.`,
                                                closable: true
                                            })
                                    }}>
                                        <Clipboard.Trigger asChild>
                                            <HStack align={"center"} justify={"space-between"} >
                                                <HStack color="neutral-3">
                                                    <MdOutlineKey size={20} />
                                                    <Text>
                                                        Invite Token: {" "}
                                                        <Clipboard.ValueText />
                                                    </Text>
                                                </HStack>
                                                <Clipboard.Indicator />
                                            </HStack>
                                        </Clipboard.Trigger>
                                    </Clipboard.Root>
                                </Stack>
                            </HStack>
                            <SimpleGrid w="full" gap={2}>
                                <Button
                                    size={isDesktop ? "lg" : "sm"}
                                    type="submit"
                                    fontSize={"1.2rem"}
                                    borderRadius={"10px"}
                                    padding={"global-spacing"}
                                    bgColor={"primary-1"}
                                    color={"white"}
                                    transition={"all 0.2s ease-in-out"}
                                    _hover={{
                                        bgColor: "primary-2",
                                    }}
                                    onClick={() => {
                                        setIsOpen(false)
                                        redirect("/profile");
                                    }}
                                >Profile</Button>
                                <Button
                                    color="primary-9"
                                    bg="primary-8"
                                    size={isDesktop ? "lg" : "sm"}
                                    type="submit"
                                    fontSize={"1.2rem"}
                                    borderRadius={"10px"}
                                    padding={"global-spacing"}
                                    transition={"all 0.2s ease-in-out"}
                                    _hover={{
                                        opacity: 0.9
                                    }}
                                    onClick={() => {
                                        setIsOpen(false)
                                        redirect("/auth/logout");
                                    }}
                                >Logout
                                </Button>
                            </SimpleGrid>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    )
}
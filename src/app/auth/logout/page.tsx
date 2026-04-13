"use client";
import { useAuth, useIsAuthenticated, userDataAtom } from "@/atoms/auth";
import { logoutUser } from "@/api/auth";
import { useSetAtom } from "jotai";
import { redirect } from "next/navigation";
import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useWindowType } from "@/hooks/use-window-type";
import LogoHorse from "@/components/ui/internal/logo-horse";
import { FiLogOut } from "react-icons/fi";

export default function Logout() {
  const isAuth = useIsAuthenticated();
  const userData = useAuth();
  const { isDesktop } = useWindowType();
  const setUserData = useSetAtom(userDataAtom);

  if (!isAuth) {
    redirect("/");
  }

  const handleLogout = async () => {
    if (userData?.token) {
      await logoutUser();
    }
    setUserData(null);
    redirect("/auth/login");
  };

  return (
    <Stack w="full" h="full" mt={-16} justify="center" align="center">
      <LogoHorse width={300} height={300} />
      <Stack textAlign={"center"}>
        <Heading size="md" fontWeight={"bold"}>
          Are you sure you want to disconnect from the IEEE mainframe?
        </Heading>
        <Text>
          Warning: Logging out may cause a temporary loss of electromagnetic
          awesomeness!
        </Text>
      </Stack>
      <Button
        onClick={handleLogout}
        variant="outline"
        width={"fit"}
        bgColor={"primary-1"}
        rounded="xl"
        padding={"10px 20px"}
        justifyContent={"center"}
        textAlign="center"
        color="white"
        transition="all"
        _hover={{ backgroundColor: "primary-10" }}
        size={isDesktop ? "xl" : "md"}
      >
        Logout <FiLogOut />
      </Button>
    </Stack>
  );
}

"use client"

import { ChakraProvider } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import { system } from "../theme"
import { SWRConfig } from "swr"

export function Provider(props: ColorModeProviderProps) {
  return (
    <SWRConfig value={{
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 2,
    }}>
      <ChakraProvider value={system}>
        <ColorModeProvider {...props} />
      </ChakraProvider>
    </SWRConfig>
  )
}

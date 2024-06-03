"use client";

import { styleReset } from "react95";
import { createGlobalStyle, ThemeProvider } from "styled-components";

/* Pick a theme of your choice */
import original from "react95/dist/themes/original";

const GlobalStyles = createGlobalStyle`${styleReset}`;

export default function DesktopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider theme={original}>
      <GlobalStyles />
      {children}
    </ThemeProvider>
  );
}

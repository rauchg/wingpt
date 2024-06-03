import type { Metadata } from "next";
import localFont from "next/font/local";
import theme from "react95/dist/themes/original";

const MSSansSerif = localFont({
  src: [
    {
      path: "./fonts/ms_sans_serif.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ms_sans_serif_bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "WinGPT",
  description: "AI chatbot designed like it was built for Windows 95",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{
        overflow: "hidden",
        backgroundColor: theme.desktopBackground,
      }}
    >
      <body className={`${MSSansSerif.className}`}>{children}</body>
    </html>
  );
}

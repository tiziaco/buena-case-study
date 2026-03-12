import { Public_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";

import type { Metadata } from "next";
import "@/styles/globals.css";

const publicSans = Public_Sans({subsets:['latin'],variable:'--font-sans'});


export const metadata: Metadata = {
  title: "Bonita App",
  description: "Property management app",
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/icons/favicon-16x16.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/icons/favicon-32x32.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: [{ url: "/icons/favicon-ios-57x57.ico", sizes: "57x57" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning className={publicSans.variable}>
        <body
          className={`antialiased min-h-screen bg-background`}
        >
          <QueryProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              disableTransitionOnChange
          >
              {children}
              <Toaster position="bottom-right" />
            </ThemeProvider>
          </QueryProvider>
        </body>
      </html>
  );
}

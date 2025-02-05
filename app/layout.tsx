import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "md2anki",
  description: "Generate Anki flashcards from markdown",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + " h-dvh"}>
        <main className="flex flex-col items-center h-full">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}

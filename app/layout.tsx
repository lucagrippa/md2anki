import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import Header from "@/components/header";

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
            <body className={`${inter.className} min-h-screen flex flex-col`}>
                <StackProvider app={stackServerApp}>
                    <StackTheme>
                        <Header />
                        <main className="flex-grow flex flex-col items-center">
                            {children}
                        </main>
                        <footer className="w-full bg-background">
                            <div className="flex flex-row justify-center md:justify-between font-mono text-primary p-4 text-sm">
                                <div className="hidden md:block"></div>
                                <div>
                                    Extension of{" "}
                                    <a
                                        className="hover:bg-muted p-2 rounded-sm"
                                        href="https://md2anki.vercel.app"
                                    >
                                        {" "}
                                        md2anki
                                    </a>{" "}
                                    by{" "}
                                    <a
                                        className="hover:bg-muted p-2 rounded-sm"
                                        href="https://lucagrippa.io"
                                    >
                                        lucagrippa{" "}
                                    </a>
                                </div>
                                <div className="hidden md:block">
                                    <a
                                        className="hover:bg-muted p-2 rounded-sm"
                                        href="https://md2anki.canny.io"
                                    >
                                        features
                                    </a>
                                </div>
                            </div>
                        </footer>
                        <Toaster />
                        <Analytics />
                    </StackTheme>
                </StackProvider>
            </body>
        </html>
    );
}

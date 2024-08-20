import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import { UserButton } from "@stackframe/stack";
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
            <body className={inter.className + " min-h-screen"}>
                <StackProvider app={stackServerApp}>
                    <StackTheme>
                        <header className="top-0 left-0 right-0 p-4 bg-background flex flex-row justify-between items-center">
                            <UserButton />
                            <div className="flex flex-row space-x-4">
                                <a className="text-primary" href="/">
                                    Flashcards
                                </a>
                                
                                <a className="text-primary" href="/summarize">
                                    Summarize
                                </a>

                                {/* <a className="text-primary" href="/exams">
                                    Exams
                                </a>
                                <a className="text-primary" href="/search">
                                    Search
                                </a> */}
                            </div>
                        </header>
                        <main className="flex flex-col items-center min-h-screen">
                            {children}
                        </main>
                        <footer className="bottom-0 left-0 right-0 p-4 bg-background flex flex-col">
                            <div className="flex flex-row justify-center md:justify-between font-mono text-muted-foreground text-sm">
                                <div className="hidden md:block"></div>
                                <div>
                                    Extension of{" "}
                                    <a
                                        className=""
                                        href="https://md2anki.vercel.app"
                                    >
                                        {" "}
                                        md2anki
                                    </a>{" "}
                                    by{" "}
                                    <a
                                        className=""
                                        href="https://lucagrippa.io"
                                    >
                                        lucagrippa{" "}
                                    </a>
                                </div>
                                <div className="hidden md:block">
                                    <a
                                        className=""
                                        href="https://md2anki.canny.io"
                                    >
                                        features
                                    </a>
                                </div>
                            </div>
                        </footer>
                        <Toaster />
                    </StackTheme>
                </StackProvider>
            </body>
        </html>
    );
}

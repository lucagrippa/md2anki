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
      <body className={inter.className + " min-h-screen"}>
        <main className="flex flex-col items-center min-h-screen">
          {children}
        </main>
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background flex flex-col">
          <div className="flex flex-row justify-center md:justify-between font-mono text-muted-foreground text-sm">
            <div className="hidden md:block">
              <a className="" href="https://lucagrippa.io" >lucagrippa </a>
            </div>
            <div>
              Built with{" "}
              <a className="" href="https://sdk.vercel.ai" > Vercel AI SDK </a>
              &{" "}
              <a className="" href="https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/" > GPT-4o mini</a>
            </div>
            <div className="hidden md:block">
              <a className="" href="https://github.com/lucagrippa/md2anki">source</a>
              {" / "}
              <a className="" href="https://md2anki.canny.io">features</a>

            </div>
          </div>

        </footer>
        <Toaster />
      </body>
    </html>
  );
}

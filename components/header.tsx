import { stackServerApp } from "@/stack";
import { UserButton } from "@stackframe/stack";

export default async function Header() {
    const user = await stackServerApp.getUser();

    return (
        <header className="top-0 left-0 right-0 p-4 bg-background flex flex-row justify-between items-center font-mono text-muted-foreground">
            {user ? (
                <UserButton />
            ) : (
                <a
                    className="text-primary hover:bg-muted p-2 rounded-sm"
                    href="/handler/sign-in?after_auth_return_to=%2F"
                >
                    Sign in
                </a>
            )}

            <div className="flex flex-row space-x-4">
                <a
                    className="text-primary hover:bg-muted p-2 rounded-sm"
                    href="/"
                >
                    Flashcards
                </a>

                <a
                    className="text-primary hover:bg-muted p-2 rounded-sm"
                    href="/summarize"
                >
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
    );
}

"use client";

import Chat from "@/components/chat";

export default function Page() {
    return (
        <div className="flex flex-col w-full p-6">
            <Chat knowledge="No file was uploaded" filePath="" className="w-full p-6 mt-16" />
        </div>
    );
}

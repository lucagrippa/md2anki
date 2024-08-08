"use client"

import { useState } from "react";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"


import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"


const formSchema = z.object({
    apiKey: z.string().min(2).max(75),
    document: z.instanceof(File).optional(),
})
type FormValues = z.infer<typeof formSchema>

interface GenerateDeckFormProps {
    onGenerateDeck: (markdownContent: string, apiKey: string) => Promise<void>
}

export default function GenerateDeckForm({ onGenerateDeck }: GenerateDeckFormProps) {
    const [markdownContent, setMarkdownContent] = useState<string | null>(null);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            apiKey: "",
            document: undefined,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values, markdownContent)
        toast({
            title: "You submitted the following values:",
            description: (
                <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                    <code className="text-white">{JSON.stringify(values, null, 2)}</code>
                </pre>
            ),
        })

        if (!markdownContent) {
            toast({
                title: "Error",
                description: "Please upload a markdown file",
                variant: "destructive",
            });
            return;
        }

        try {
            await onGenerateDeck(markdownContent, values.apiKey)
            toast({
                title: "Success",
                description: "Anki deck generated successfully",
            })
        } catch (error) {
            console.error("Error generating deck:", error)
            toast({
                title: "Error",
                description: "Failed to generate Anki deck. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const text = await file.text();
            setMarkdownContent(text);
        }
    };

    return (
        <div className="">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full items-start gap-6">
                    <fieldset className="grid md:grid-cols-2 gap-6 rounded-lg border p-4">
                        <legend className="-ml-1 px-1 text-sm font-medium">Configuration</legend>
                        <FormField
                            control={form.control}
                            name="apiKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Key</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="sk-l..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </fieldset>
                    <FormField
                        control={form.control}
                        name="document"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Document</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept=".md"
                                        // onChange={(e) => field.onChange(e.target.files?.[0])}
                                        onChange={(e) => {
                                            field.onChange(e.target.files?.[0]);
                                            handleFileChange(e);
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Upload a markdown file to generate your Anki deck.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Generate Anki deck</Button>
                </form>
            </Form>
        </div>
    )
}

import fs from 'fs';
import path from 'path';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageShell } from "@/components/common/PageShell";
import { Section } from "@/components/ui/Section";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata = {
    title: 'Documentation | DFDS.io',
    description: 'Project documentation and technical guide for Team Cloudzz.',
};

export default function DocsPage() {
    const docsPath = path.join(process.cwd(), 'DFDS_Dokumentacija.md');

    let fileContent = '';
    try {
        fileContent = fs.readFileSync(docsPath, 'utf8');
    } catch (_) {
        fileContent = '# Error Loading Documentation\n\nCould not find `DFDS_Dokumentacija.md`. Please ensure it is present in the project root.';
    }

    return (
        <PageShell>
            <Section className="max-w-5xl mx-auto pt-12 md:pt-20">
                <header className="text-center space-y-6 mb-16">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                        Docs
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Technical overview and architectural guide for the DFDS platform.
                    </p>
                </header>

                <GlassCard className="p-8 md:p-12 border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="prose prose-invert prose-indigo max-w-none">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                pre: ({ ...props }) => (
                                    <div className="relative group my-8">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                        <pre {...props} className="relative bg-black/80 p-6 rounded-2xl overflow-x-auto border border-white/10 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10" />
                                    </div>
                                ),
                                code: ({ ...props }) => (
                                    <code {...props} className="bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm text-indigo-300 font-mono border border-indigo-500/20" />
                                ),
                                h1: ({ ...props }) => <h1 {...props} className="text-4xl font-bold mt-16 mb-8 text-white tracking-tight pb-4 border-b border-white/5" />,
                                h2: ({ ...props }) => <h2 {...props} className="text-2xl font-bold mt-12 mb-6 text-indigo-400 tracking-tight" />,
                                h3: ({ ...props }) => <h3 {...props} className="text-xl font-bold mt-10 mb-4 text-white/90 tracking-tight" />,
                                table: ({ ...props }) => <div className="overflow-x-auto my-8 border border-white/10 rounded-2xl"><table {...props} className="min-w-full text-left text-sm border-collapse" /></div>,
                                th: ({ ...props }) => <th {...props} className="bg-white/5 border-b border-white/10 font-bold p-4 text-zinc-400 uppercase tracking-widest text-[10px]" />,
                                td: ({ ...props }) => <td {...props} className="border-b border-white/5 p-4 text-zinc-400" />,
                                blockquote: ({ ...props }) => (
                                    <blockquote {...props} className="border-l-4 border-indigo-500 pl-6 py-2 my-8 bg-indigo-500/5 rounded-r-2xl italic text-zinc-300" />
                                ),
                                a: ({ ...props }) => (
                                    <a {...props} className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-500/30 underline-offset-4 transition-all" target="_blank" rel="noopener noreferrer" />
                                ),
                                img: ({ ...props }) => (
                                    <img {...props} className="rounded-2xl border border-white/10 shadow-2xl my-10 w-full" alt={props.alt || "Documentation Image"} />
                                ),
                                hr: ({ ...props }) => <hr {...props} className="border-white/5 my-16" />,
                                ul: ({ ...props }) => <ul {...props} className="list-disc list-outside ml-6 my-6 space-y-3 text-zinc-400" />,
                                ol: ({ ...props }) => <ol {...props} className="list-decimal list-outside ml-6 my-6 space-y-3 text-zinc-400" />,
                            }}
                        >
                            {fileContent}
                        </Markdown>
                    </div>
                </GlassCard>
            </Section>
        </PageShell>
    );
}

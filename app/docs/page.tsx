import fs from 'fs';
import path from 'path';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnhancedBackground } from '@/components/ui/EnhancedBackground';

export const metadata = {
    title: 'Documentation | DFDS.io',
    description: 'Project documentation and technical guide for Team Cloudzz.',
};

export default function DocsPage() {
    // Read the documentation file from the project root
    // In production (Docker), this file is copied to the WORKDIR
    // In development, it's in the project root
    const docsPath = path.join(process.cwd(), 'DFDS_Dokumentacija.md');

    let fileContent = '';
    try {
        fileContent = fs.readFileSync(docsPath, 'utf8');
    } catch (_) {
        fileContent = '# Error Loading Documentation\n\nCould not find `DFDS_Dokumentacija.md`. Please ensure it is present in the project root.';
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <EnhancedBackground />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-24">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
                        Documentation
                    </h1>
                    <p className="text-xl text-gray-400">
                        Technical overview and architectural guide for DFDS.
                    </p>
                </div>

                <div className="prose prose-invert prose-indigo max-w-none bg-zinc-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm shadow-2xl">
                    <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Custom components to match the "Glassmorphism" look
                            pre: ({ ...props }) => (
                                <div className="relative group my-6">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                    <pre {...props} className="relative bg-black/80 p-6 rounded-lg overflow-x-auto border border-white/10 text-sm leading-relaxed" />
                                </div>
                            ),
                            code: ({ ...props }) => (
                                <code {...props} className="bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm text-indigo-300 font-mono border border-indigo-500/20" />
                            ),
                            h1: ({ ...props }) => <h1 {...props} className="text-3xl font-bold mt-12 mb-6 text-white pb-4 border-b border-indigo-500/30" />,
                            h2: ({ ...props }) => <h2 {...props} className="text-2xl font-semibold mt-10 mb-4 text-indigo-400 flex items-center gap-2" />,
                            h3: ({ ...props }) => <h3 {...props} className="text-xl font-medium mt-8 mb-3 text-white/90" />,
                            table: ({ ...props }) => <div className="overflow-x-auto my-8 border border-white/10 rounded-lg"><table {...props} className="min-w-full text-left text-sm border-collapse" /></div>,
                            th: ({ ...props }) => <th {...props} className="bg-white/5 border-b border-white/10 font-semibold p-4 text-indigo-300" />,
                            td: ({ ...props }) => <td {...props} className="border-b border-white/5 p-4 text-gray-300" />,
                            blockquote: ({ ...props }) => (
                                <blockquote {...props} className="border-l-4 border-purple-500 pl-4 py-1 my-6 bg-purple-500/5 rounded-r-lg italic text-gray-300" />
                            ),
                            a: ({ ...props }) => (
                                <a {...props} className="text-indigo-400 hover:text-indigo-300 font-medium underline decoration-indigo-500/30 hover:decoration-indigo-500 transition-colors" target="_blank" rel="noopener noreferrer" />
                            ),
                            img: ({ ...props }) => (
                                <img {...props} className="rounded-xl border border-white/10 shadow-lg my-8 w-full" alt={props.alt || "Documentation Image"} />
                            ),
                            hr: ({ ...props }) => <hr {...props} className="border-white/10 my-12" />,
                            ul: ({ ...props }) => <ul {...props} className="list-disc list-outside ml-6 my-4 space-y-2 text-gray-300" />,
                            ol: ({ ...props }) => <ol {...props} className="list-decimal list-outside ml-6 my-4 space-y-2 text-gray-300" />,
                        }}
                    >
                        {fileContent}
                    </Markdown>
                </div>
            </div>
        </div>
    );
}

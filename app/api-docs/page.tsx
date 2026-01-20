import fs from 'fs';
import path from 'path';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnhancedBackground } from '@/components/ui/EnhancedBackground';

export const metadata = {
    title: 'API Documentation | DFDS.io',
    description: 'Complete API reference for the DFDS.io platform.',
};

export default function ApiDocsPage() {
    const docsPath = path.join(process.cwd(), 'app/api-docs/api_documentation.md');
    const fileContent = fs.readFileSync(docsPath, 'utf8');

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <EnhancedBackground />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-8">
                    API Documentation
                </h1>

                <div className="prose prose-invert prose-emerald max-w-none bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm shadow-2xl">
                    <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            pre: ({ ...props }) => (
                                <div className="relative group">
                                    <pre {...props} className="bg-black/50 p-4 rounded-lg overflow-x-auto border border-white/10" />
                                </div>
                            ),
                            code: ({ ...props }) => (
                                <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-emerald-300 font-mono" />
                            ),
                            h1: ({ ...props }) => <h1 {...props} className="text-3xl font-bold mt-12 mb-6 text-white pb-2 border-b border-white/10" />,
                            h2: ({ ...props }) => <h2 {...props} className="text-2xl font-bold mt-10 mb-4 text-emerald-400" />,
                            h3: ({ ...props }) => <h3 {...props} className="text-xl font-bold mt-8 mb-3 text-white" />,
                            table: ({ ...props }) => <div className="overflow-x-auto my-6"><table {...props} className="min-w-full text-left text-sm border-collapse" /></div>,
                            th: ({ ...props }) => <th {...props} className="border-b border-white/10 font-semibold p-4 text-emerald-400" />,
                            td: ({ ...props }) => <td {...props} className="border-b border-white/5 p-4 text-gray-300" />,
                            blockquote: ({ ...props }) => (
                                <blockquote {...props} className="border-l-4 border-emerald-500 pl-4 py-1 my-6 bg-emerald-500/10 rounded-r-lg italic" />
                            ),
                        }}
                    >
                        {fileContent}
                    </Markdown>
                </div>
            </div>
        </div>
    );
}

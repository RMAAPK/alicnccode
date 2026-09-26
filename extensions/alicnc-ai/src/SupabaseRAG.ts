import * as vscode from 'vscode';

export class SupabaseRAG {
    private supabaseUrl: string;
    private supabaseKey: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('alicnc.ai');
        this.supabaseUrl = config.get<string>('supabaseUrl') || '';
        this.supabaseKey = config.get<string>('supabaseKey') || '';
    }

    /**
     * Connects to the user's Supabase instance to retrieve codebase context
     * using the pgvector `match_documents` RPC function.
     */
    public async fetchContext(prompt: string): Promise<string> {
        if (!this.supabaseUrl || !this.supabaseKey) {
            console.warn("Ali CNC AI: Supabase URL or Key not set. Skipping RAG.");
            return "";
        }

        try {
            // Step 1: Embed the prompt (Mocked here, typically you'd hit an embedding API first)
            // const embedding = await getEmbedding(prompt);
            const dummyEmbedding = new Array(1536).fill(0.01);

            // Step 2: Query Supabase
            const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/match_documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                },
                body: JSON.stringify({
                    query_embedding: dummyEmbedding,
                    match_threshold: 0.7,
                    match_count: 5
                })
            });

            if (!response.ok) {
                throw new Error(`Supabase Error: ${response.statusText}`);
            }

            const documents: any[] = await response.json();
            
            if (documents.length === 0) return "";

            // Format retrieved context
            const contextText = documents.map(doc => `--- File: ${doc.file_path} ---\n${doc.content}`).join('\n\n');
            return `\n\n### Codebase Context ###\n${contextText}\n########################\n`;

        } catch (error) {
            console.error("Failed to fetch RAG context", error);
            return "";
        }
    }
}

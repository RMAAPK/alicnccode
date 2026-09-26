/* Migration to create airag table and insert pstack plugin manifest */
CREATE TABLE public.airag (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    definition JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.airag (name, description, definition) VALUES (
    'pstack',
    'if you want to go fast, go deep first. pstack helps you write less, but higher quality code. rigorous agent workflows you can parallelize with confidence.',
    '{
        "name": "pstack",
        "displayName": "pstack",
        "version": "0.15.5",
        "description": "if you want to go fast, go deep first. pstack helps you write less, but higher quality code. rigorous agent workflows you can parallelize with confidence.",
        "author": {"name": "Lauren Tan"},
        "homepage": "https://github.com/cursor/plugins/tree/main/pstack",
        "repository": "https://github.com/cursor/plugins/tree/main/pstack"
    }'
);

export type SupportedAIProvider = {
    provider: string
    baseUrl: string
    displayName: string
    markdown: string
    logoUrl: string
    auth: {
        headerName: string
        bearer: boolean
    }
    models: {
        label: string
        value: string
        supported: Array<'text' | 'image' | 'function' | 'moderation'>
    }[]
}

export const SUPPORTED_AI_PROVIDERS: SupportedAIProvider[] = [
    {
        provider: 'openai',
        baseUrl: 'https://api.openai.com',
        displayName: 'OpenAI',
        markdown: `Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`,
        logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
        auth: {
            headerName: 'Authorization',
            bearer: true,
        },
        models: [
            {
                label: 'GPT-4o',
                value: 'gpt-4o',
                supported: ['text', 'image', 'function', 'moderation'],
            },
            
        ],
    },
    {
        provider: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        displayName: 'Anthropic',
        markdown: `Follow these instructions to get your Claude API Key:

1. Visit the following website: https://console.anthropic.com/settings/keys.
2. Once on the website, locate and click on the option to obtain your Claude API Key.
`,
        logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
        auth: {
            headerName: 'x-api-key',
            bearer: false,
        },
        models: [
            {
                label: 'claude-3-7-haiku',
                value: 'claude-3-7-haiku-latest',
                supported: ['text', 'function'],
            },
            {
                label: 'claude-3-7-sonnet',
                value: 'claude-3-7-sonnet-latest',
                supported: ['text', 'function'],
            },
        ],
    },
    {
        provider: 'replicate',
        baseUrl: 'https://api.replicate.com',
        displayName: 'Replicate',
        markdown: `Follow these instructions to get your Replicate API Key:

1. Visit the following website: https://replicate.com/account/api-tokens.
2. Once on the website, locate and click on the option to obtain your Replicate API Key.
`,
        logoUrl: 'https://cdn.activepieces.com/pieces/replicate.png',
        auth: {
            headerName: 'Authorization',
            bearer: true,
        },
        models: [
            {
                label: 'meta/meta-llama-3-70b-instruct',
                value: 'meta/meta-llama-3-70b-instruct',
                supported: ['text'],
            },
        ],
    },
]

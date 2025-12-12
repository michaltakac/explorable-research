# Explorable Research

Create interactive, explorable web pages from research articles.

Transform complex research papers into engaging, interactive experiences that readers can explore, manipulate, and learn from.

Powered by [E2B](https://e2b.dev), [OpenRouter](https://openrouter.ai), and [AI SDK](https://sdk.vercel.ai). Based on [Fragments by E2B](https://github.com/e2b-dev/fragments).

## Features

- **AI-Powered Generation** - Describe your research concept and get an interactive explorable instantly
- **Secure Code Execution** - Uses [E2B SDK](https://github.com/e2b-dev/code-interpreter) to safely execute AI-generated code in sandboxed environments
- **Real-time Streaming** - Watch your explorable come to life with live streaming UI updates
- **Explorable Research Template**:
  - ⚛️ React + Vite with TypeScript
  - 🎨 Three.js / React Three Fiber for 3D visualizations
  - ✨ Motion (Framer Motion) for animations
  - 🎯 Tailwind CSS for styling
  - 📄 ArXiv paper support - paste a link and get an interactive explorable
- **Supported AI Models** via [OpenRouter](https://openrouter.ai):
  - OpenAI (GPT-5.1, GPT-5.1 Codex)
  - Anthropic (Claude 4.5 Sonnet, Claude 4.5 Haiku, Claude 4.5 Opus)
  - Google (Gemini 3 Pro Preview)
  - xAI (Grok 4.1 Fast)
- **Token-Efficient Editing** - Integrates with [Morph](https://morphllm.com/) for accurate, fast code modifications
- Built with Next.js 14 (App Router), shadcn/ui, and TailwindCSS

## Get Started

### Prerequisites

- [Node.js](https://nodejs.org) (recent version)
- [E2B API Key](https://e2b.dev)
- [OpenRouter API Key](https://openrouter.ai/keys)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/explorable-research.git
cd explorable-research
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your API keys:

```sh
# Required
E2B_API_KEY="your-e2b-api-key"
OPENROUTER_API_KEY="your-openrouter-api-key"

# Optional - for token-efficient code editing
MORPH_API_KEY=

# Optional - deployment and auth
NEXT_PUBLIC_SITE_URL=
RATE_LIMIT_MAX_REQUESTS=
RATE_LIMIT_WINDOW=
KV_REST_API_URL=
KV_REST_API_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) and start creating explorables!

## Creating Explorables

Simply describe what you want to visualize or explain:

- *"Create an interactive visualization of gradient descent showing how learning rate affects convergence"*
- *"Build an explorable explaining the attention mechanism in transformers"*
- *"Visualize how different activation functions behave with adjustable parameters"*
- *"Create an interactive simulation of Conway's Game of Life"*

The AI will generate a fully interactive web application that you can explore, modify, and share.

## Customization

### Adding Custom Templates

1. Install the [E2B CLI](https://e2b.dev/docs/cli) and log in
2. Create a new folder under `sandbox-templates/`
3. Initialize with `e2b template init`
4. Configure your `e2b.Dockerfile` and `e2b.toml`
5. Deploy with `e2b template build --name <template-name>`
6. Add your template to `lib/templates.ts`

### Adding AI Models

Edit `lib/models.json` to add models using [OpenRouter model IDs](https://openrouter.ai/models):

```json
{
  "id": "anthropic/claude-3.5-sonnet",
  "name": "Claude 3.5 Sonnet",
  "provider": "Anthropic",
  "providerId": "anthropic",
  "multiModal": true
}
```

## Contributing

Contributions are welcome! Feel free to open issues or pull requests for bug fixes, improvements, or new features.

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.

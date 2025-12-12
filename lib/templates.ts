export function getTemplateIdSuffix(id: string) {
  const isDev = process.env.NODE_ENV === 'development'
  return isDev ? `${id}-dev` : id
}

export function getTemplateId(id: string) {
  return id.replace(/-dev$/, '')
}

const templates = {
  [getTemplateIdSuffix('explorable-research-developer')]: {
    name: 'Explorable Research developer',
    lib: [
      "react@^19.2.0",
      "react-dom@^19.2.0",
      "@react-three/fiber@^9.4.0",
      "@react-three/drei@^10.7.7",
      "three@^0.181.1",
      "motion@^12.23.25",
      "lucide-react@^0.553.0",
      "@types/node@^22.14.0",
      "@vitejs/plugin-react@^5.0.0",
      "typescript@~5.8.2",
      "vite@^6.2.0"
    ],
    file: 'App.tsx',
    instructions:
      'A single-page app template using React + Vite, that reloads automatically. When user provides a link to a ArXiv paper (ignore any other types of links and URLs), get the contents of this paper (PDF form available on ArXiv, so you need to access it through web), and create an explorable research page from it based on the template provided.',
    port: 3000,
  },
  [getTemplateIdSuffix('streamlit-developer')]: {
    name: 'Streamlit developer',
    lib: [
      'streamlit',
      'pandas',
      'numpy',
      'matplotlib',
      'requests',
      'seaborn',
      'plotly',
    ],
    file: 'app.py',
    instructions: 'A streamlit app that reloads automatically.',
    port: 8501,
  },
}

export type Templates = typeof templates
export default templates

export function templatesToPrompt(templates: Templates) {
  return `${Object.entries(templates)
    .map(
      ([id, t], index) =>
        `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`,
    )
    .join('\n')}`
}

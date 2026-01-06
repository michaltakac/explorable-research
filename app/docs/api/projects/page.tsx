'use client'

import { EndpointCard } from '@/components/docs/endpoint-card'
import { ApiPlayground } from '@/components/docs/api-playground'
import { Separator } from '@/components/ui/separator'

export default function ProjectsApiPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Projects API</h1>
        <p className="text-xl text-muted-foreground">
          Create, list, and manage your explorable projects programmatically.
        </p>
      </div>

      {/* Create Project (v1 API) */}
      <section className="space-y-4">
        <h2 id="create-project" className="text-2xl font-semibold">
          Create Project
        </h2>
        <EndpointCard
          method="POST"
          endpoint="/api/v1/projects/create"
          title="Create a new project from a research paper"
          description="Creates a new interactive explorable from an ArXiv paper or uploaded PDF. The endpoint processes the paper, generates interactive code using AI, deploys it to a sandbox, and returns the project details with a live preview URL."
          parameters={[
            {
              name: 'arxiv_url',
              type: 'string',
              required: false,
              description: 'ArXiv paper URL (e.g., https://arxiv.org/abs/2301.00001). Either arxiv_url or pdf_file is required.',
            },
            {
              name: 'pdf_file',
              type: 'string',
              required: false,
              description: 'Base64-encoded PDF file content. Either arxiv_url or pdf_file is required.',
            },
            {
              name: 'pdf_filename',
              type: 'string',
              required: false,
              description: 'Filename for the PDF (required when pdf_file is provided).',
            },
            {
              name: 'instruction',
              type: 'string',
              required: false,
              description: 'Custom instructions for the AI to guide the visualization generation (max 10,000 characters).',
            },
            {
              name: 'images',
              type: 'array',
              required: false,
              description: 'Array of image attachments (max 8). Each image: { data: "base64...", mimeType: "image/png", filename?: "chart.png" }',
            },
            {
              name: 'model',
              type: 'string',
              required: false,
              description: 'Model ID to use for generation. Defaults to gemini-3-pro-preview. See /api/models for available models.',
            },
            {
              name: 'model_config',
              type: 'object',
              required: false,
              description: 'Model configuration: { temperature?: 0-2, topP?: 0-1, topK?: number, maxTokens?: number }',
            },
            {
              name: 'template',
              type: 'string',
              required: false,
              description: 'Template to use: "explorable-research-developer" (default) or "html-developer"',
            },
            {
              name: 'include_code',
              type: 'boolean',
              required: false,
              description: 'Include generated code and fragment in response (default: false)',
            },
            {
              name: 'include_messages',
              type: 'boolean',
              required: false,
              description: 'Include conversation messages in response (default: false)',
            },
          ]}
          requestExample={{
            language: 'curl',
            code: `curl -X POST "https://explorableresearch.com/api/v1/projects/create" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "arxiv_url": "https://arxiv.org/abs/2301.00001",
    "instruction": "Focus on visualizing the key algorithm",
    "include_code": true
  }'`,
          }}
          responseExample={{
            code: `{
  "success": true,
  "project": {
    "id": "abc123",
    "title": "Gradient Descent Visualization",
    "description": "Interactive visualization of gradient descent optimization...",
    "created_at": "2024-01-15T10:30:00Z",
    "preview_url": "https://sandbox.e2b.dev/...",
    "sandbox_id": "sbx-abc123",
    "template": "explorable-research-developer",
    "code": "import React from 'react';...",
    "fragment": { "title": "...", "code": "..." }
  }
}`,
          }}
        >
          <ApiPlayground
            method="POST"
            endpoint="/api/v1/projects/create"
            defaultBody={JSON.stringify({
              arxiv_url: "https://arxiv.org/abs/2301.00001",
              instruction: "Focus on visualizing the key algorithm",
              include_code: true
            }, null, 2)}
          />
        </EndpointCard>
      </section>

      <Separator />

      {/* Continue Project (v1 API) */}
      <section className="space-y-4">
        <h2 id="continue-project" className="text-2xl font-semibold">
          Continue Project
        </h2>
        <EndpointCard
          method="POST"
          endpoint="/api/v1/projects/:project_id/continue"
          title="Continue an existing project with new instructions"
          description="Adds new instructions to an existing project, regenerates the visualization, and updates the project. This reuses the existing sandbox when possible for faster iteration."
          parameters={[
            {
              name: 'project_id',
              type: 'string',
              required: true,
              description: 'The unique identifier of the project to continue (path parameter)',
            },
            {
              name: 'instruction',
              type: 'string',
              required: true,
              description: 'New instructions for the AI to modify or enhance the visualization (max 10,000 characters).',
            },
            {
              name: 'images',
              type: 'array',
              required: false,
              description: 'Array of image attachments (max 8). Each image: { data: "base64...", mimeType: "image/png", filename?: "chart.png" }',
            },
            {
              name: 'model',
              type: 'string',
              required: false,
              description: 'Model ID to use for generation. Uses same model as project creation if not specified.',
            },
            {
              name: 'model_config',
              type: 'object',
              required: false,
              description: 'Model configuration: { temperature?: 0-2, topP?: 0-1, topK?: number, maxTokens?: number }',
            },
            {
              name: 'include_code',
              type: 'boolean',
              required: false,
              description: 'Include generated code and fragment in response (default: false)',
            },
            {
              name: 'include_messages',
              type: 'boolean',
              required: false,
              description: 'Include full conversation history in response (default: false)',
            },
          ]}
          requestExample={{
            language: 'curl',
            code: `curl -X POST "https://explorableresearch.com/api/v1/projects/abc123/continue" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instruction": "Add a slider to control the learning rate",
    "include_code": true
  }'`,
          }}
          responseExample={{
            code: `{
  "success": true,
  "project": {
    "id": "abc123",
    "title": "Gradient Descent Visualization",
    "description": "Interactive visualization with learning rate control...",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z",
    "preview_url": "https://sandbox.e2b.dev/...",
    "sandbox_id": "sbx-abc123",
    "template": "explorable-research-developer",
    "code": "import React from 'react';..."
  }
}`,
          }}
        >
          <ApiPlayground
            method="POST"
            endpoint="/api/v1/projects/:project_id/continue"
            pathParams={[
              { name: 'project_id', placeholder: 'Enter project ID' },
            ]}
            defaultBody={JSON.stringify({
              instruction: "Add a slider to control the learning rate",
              include_code: true
            }, null, 2)}
          />
        </EndpointCard>
      </section>

      <Separator />

      {/* List Projects */}
      <section className="space-y-4">
        <h2 id="list-projects" className="text-2xl font-semibold">
          List Projects
        </h2>
        <EndpointCard
          method="GET"
          endpoint="/api/projects"
          title="List all projects"
          description="Returns a list of all projects owned by the authenticated user, sorted by creation date (newest first)."
          requestExample={{
            language: 'curl',
            code: `curl -X GET "https://explorableresearch.com/api/projects" \\
  -H "x-api-key: YOUR_API_KEY"`,
          }}
          responseExample={{
            code: `{
  "projects": [
    {
      "id": "abc123",
      "title": "Gradient Descent Visualization",
      "description": "Interactive visualization of gradient descent...",
      "created_at": "2024-01-15T10:30:00Z",
      "result": {
        "url": "https://sandbox.e2b.dev/...",
        "sbxId": "sandbox-id"
      }
    },
    {
      "id": "def456",
      "title": "Neural Network Explorer",
      "description": "Interactive neural network architecture...",
      "created_at": "2024-01-14T15:45:00Z",
      "result": {
        "url": "https://sandbox.e2b.dev/...",
        "sbxId": "sandbox-id"
      }
    }
  ]
}`,
          }}
        >
          <ApiPlayground
            method="GET"
            endpoint="/api/projects"
          />
        </EndpointCard>
      </section>

      <Separator />

      {/* Get Project */}
      <section className="space-y-4">
        <h2 id="get-project" className="text-2xl font-semibold">
          Get Project
        </h2>
        <EndpointCard
          method="GET"
          endpoint="/api/projects/:project_id"
          title="Get a specific project"
          description="Retrieves detailed information about a specific project, including the generated code and conversation history."
          parameters={[
            {
              name: 'project_id',
              type: 'string',
              required: true,
              description: 'The unique identifier of the project',
            },
          ]}
          requestExample={{
            language: 'curl',
            code: `curl -X GET "https://explorableresearch.com/api/projects/abc123" \\
  -H "x-api-key: YOUR_API_KEY"`,
          }}
          responseExample={{
            code: `{
  "project": {
    "id": "abc123",
    "title": "Gradient Descent Visualization",
    "description": "Interactive visualization of gradient descent...",
    "created_at": "2024-01-15T10:30:00Z",
    "fragment": {
      "title": "Gradient Descent Visualization",
      "description": "...",
      "code": "import React from 'react';...",
      "file_path": "App.tsx",
      "template": "explorable-research-developer"
    },
    "result": {
      "url": "https://sandbox.e2b.dev/...",
      "sbxId": "sandbox-id"
    },
    "messages": [
      {
        "role": "user",
        "content": [{"type": "text", "text": "Create a gradient descent visualization..."}]
      },
      {
        "role": "assistant",
        "content": [{"type": "text", "text": "I'll create an interactive..."}]
      }
    ]
  }
}`,
          }}
        >
          <ApiPlayground
            method="GET"
            endpoint="/api/projects/:project_id"
            pathParams={[
              { name: 'project_id', placeholder: 'Enter project ID' },
            ]}
          />
        </EndpointCard>
      </section>

      <Separator />

      {/* Delete Project */}
      <section className="space-y-4">
        <h2 id="delete-project" className="text-2xl font-semibold">
          Delete Project
        </h2>
        <EndpointCard
          method="DELETE"
          endpoint="/api/projects/:project_id"
          title="Delete a project"
          description="Permanently deletes a project and its associated sandbox. This action cannot be undone."
          parameters={[
            {
              name: 'project_id',
              type: 'string',
              required: true,
              description: 'The unique identifier of the project to delete',
            },
          ]}
          requestExample={{
            language: 'curl',
            code: `curl -X DELETE "https://explorableresearch.com/api/projects/abc123" \\
  -H "x-api-key: YOUR_API_KEY"`,
          }}
          responseExample={{
            code: `// Returns 204 No Content on success`,
            title: 'Success Response',
          }}
        >
          <ApiPlayground
            method="DELETE"
            endpoint="/api/projects/:project_id"
            pathParams={[
              { name: 'project_id', placeholder: 'Enter project ID to delete' },
            ]}
          />
        </EndpointCard>
      </section>

      {/* Usage Examples */}
      <section className="space-y-4 pb-8">
        <h2 id="examples" className="text-2xl font-semibold">
          Code Examples
        </h2>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-medium">Python</h3>
            <div className="rounded-lg border bg-muted/30 p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{`import requests
import base64

API_KEY = "your_api_key_here"
BASE_URL = "https://explorableresearch.com"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# Create a project from an ArXiv paper
response = requests.post(
    f"{BASE_URL}/api/v1/projects/create",
    headers=headers,
    json={
        "arxiv_url": "https://arxiv.org/abs/2301.00001",
        "instruction": "Focus on visualizing the key algorithm",
        "include_code": True
    }
)
project = response.json()["project"]
print(f"Created: {project['title']}")
print(f"Preview: {project['preview_url']}")

# Create from a local PDF
with open("paper.pdf", "rb") as f:
    pdf_base64 = base64.b64encode(f.read()).decode()

response = requests.post(
    f"{BASE_URL}/api/v1/projects/create",
    headers=headers,
    json={
        "pdf_file": pdf_base64,
        "pdf_filename": "paper.pdf",
        "instruction": "Create an interactive demo"
    }
)

# Continue an existing project
response = requests.post(
    f"{BASE_URL}/api/v1/projects/{project['id']}/continue",
    headers=headers,
    json={
        "instruction": "Add a slider to control parameters",
        "include_code": True
    }
)
updated_project = response.json()["project"]
print(f"Updated preview: {updated_project['preview_url']}")

# List all projects
response = requests.get(f"{BASE_URL}/api/projects", headers=headers)
projects = response.json()["projects"]

for p in projects:
    print(f"{p['title']} - {p['id']}")`}</code>
              </pre>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">JavaScript / TypeScript</h3>
            <div className="rounded-lg border bg-muted/30 p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{`const API_KEY = "your_api_key_here";
const BASE_URL = "https://explorableresearch.com";

const headers = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

// Create a project from an ArXiv paper
async function createFromArxiv(arxivUrl: string, instruction?: string) {
  const response = await fetch(\`\${BASE_URL}/api/v1/projects/create\`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      arxiv_url: arxivUrl,
      instruction,
      include_code: true,
    }),
  });
  const { project } = await response.json();
  console.log(\`Preview: \${project.preview_url}\`);
  return project;
}

// Create from a PDF file (browser)
async function createFromPdf(file: File, instruction?: string) {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  const response = await fetch(\`\${BASE_URL}/api/v1/projects/create\`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      pdf_file: base64,
      pdf_filename: file.name,
      instruction,
    }),
  });
  return response.json();
}

// Continue an existing project
async function continueProject(projectId: string, instruction: string) {
  const response = await fetch(
    \`\${BASE_URL}/api/v1/projects/\${projectId}/continue\`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        instruction,
        include_code: true,
      }),
    }
  );
  return response.json();
}

// List all projects
async function listProjects() {
  const response = await fetch(\`\${BASE_URL}/api/projects\`, {
    headers: { "x-api-key": API_KEY },
  });
  const { projects } = await response.json();
  return projects;
}

// Get a specific project
async function getProject(projectId: string) {
  const response = await fetch(\`\${BASE_URL}/api/projects/\${projectId}\`, {
    headers: { "x-api-key": API_KEY },
  });
  const { project } = await response.json();
  return project;
}

// Delete a project
async function deleteProject(projectId: string) {
  const response = await fetch(\`\${BASE_URL}/api/projects/\${projectId}\`, {
    method: "DELETE",
    headers: { "x-api-key": API_KEY },
  });
  return response.status === 204;
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}



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

API_KEY = "your_api_key_here"
BASE_URL = "https://explorableresearch.com"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# List all projects
response = requests.get(f"{BASE_URL}/api/projects", headers=headers)
projects = response.json()["projects"]

for project in projects:
    print(f"{project['title']} - {project['id']}")

# Get a specific project
project_id = projects[0]["id"]
response = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=headers)
project = response.json()["project"]
print(project["fragment"]["code"])`}</code>
              </pre>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">JavaScript / TypeScript</h3>
            <div className="rounded-lg border bg-muted/30 p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{`const API_KEY = "your_api_key_here";
const BASE_URL = "https://explorableresearch.com";

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


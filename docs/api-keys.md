# API Keys Documentation

API keys allow you to programmatically access the Explorable Research API from scripts, notebooks, or external applications.

## Overview

API keys provide an alternative authentication method to browser-based sessions. They enable:

- **Programmatic Access**: Access your data from scripts, Jupyter notebooks, or automation tools
- **Integration**: Connect third-party tools and services to your Explorable Research account
- **Automation**: Build workflows and integrations without manual login

## Security

**Treat your API keys like passwords:**

- Never share them publicly or commit them to version control
- Do not expose them in client-side code
- Rotate keys if you suspect they have been compromised
- Revoke unused keys

API keys provide the same access level as your logged-in session. Any action you can perform in the UI can be performed with your API key.

## Creating API Keys

1. Navigate to **Profile → API Keys** (or go directly to `/profile/api-keys`)
2. Click **Create API Key**
3. Enter a descriptive name (e.g., "Jupyter Notebook", "CI/CD Pipeline")
4. Click **Create Key**
5. **Copy the key immediately** – it will not be shown again

## Using API Keys

Include your API key in the `x-api-key` header of your HTTP requests:

```bash
curl -X GET "https://explorableresearch.com/api/projects" \
  -H "x-api-key: YOUR_API_KEY"
```

### Python Example

```python
import requests

API_KEY = "your_api_key_here"
BASE_URL = "https://explorableresearch.com"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# List your projects
response = requests.get(f"{BASE_URL}/api/projects", headers=headers)
projects = response.json()
print(projects)
```

### JavaScript/TypeScript Example

```typescript
const API_KEY = "your_api_key_here";
const BASE_URL = "https://explorableresearch.com";

async function listProjects() {
  const response = await fetch(`${BASE_URL}/api/projects`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });
  return response.json();
}
```

## API Endpoints

All endpoints that support JWT authentication also support API key authentication:

### Project Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List your projects |
| GET | `/api/projects/:id` | Get a specific project |
| DELETE | `/api/projects/:id` | Delete a project |

### Project Creation API (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/create` | Create project from PDF/ArXiv (sync) |
| GET | `/api/v1/projects/:id/status` | Get project status |
| POST | `/api/v1/projects/:id/continue` | Continue project with new instructions (sync) |

See [API v1 Documentation](./api-project-creation-plan.md) for detailed usage.

## Managing API Keys

### Viewing Keys

Go to **Profile → API Keys** to see all your active keys. The list shows:
- Key name
- Partial key prefix (first 8 characters)
- Creation date
- Last used timestamp

### Rotating Keys

If you need to update a key (e.g., suspected compromise):

1. Click the **rotate icon** next to the key
2. Confirm the rotation
3. Copy the new key (the old key is immediately invalidated)
4. Update your applications with the new key

### Revoking Keys

To permanently disable a key:

1. Click the **trash icon** next to the key
2. Confirm the revocation
3. The key is immediately invalidated

**Note:** Revocation cannot be undone. You'll need to create a new key if you revoked one by mistake.

## Best Practices

1. **Use descriptive names**: Name keys by their use case (e.g., "Production Server", "Local Development")
2. **One key per application**: Create separate keys for different integrations
3. **Regular rotation**: Periodically rotate keys as a security measure
4. **Environment variables**: Store keys in environment variables, not in code
5. **Limit exposure**: Only grant API access where necessary

## Troubleshooting

### "Unauthorized" Error

- Verify the API key is correct and not revoked
- Ensure the key is sent in the `x-api-key` header (not `Authorization`)
- Check that your key hasn't expired

### "Invalid API key format" Error

- Ensure you're using the complete key (including the prefix)
- The key should be a long string (160+ characters)

## Admin Guide

### Revoking Keys for a User (Admin Only)

Admins can revoke API keys for any user via SQL:

```sql
-- Find user's keys
SELECT id, description, created_at 
FROM keyhippo.api_key_metadata 
WHERE user_id = 'user-uuid-here' AND NOT is_revoked;

-- Revoke a specific key
SELECT keyhippo.revoke_api_key('key-uuid-here');

-- Revoke all keys for a user (run in psql as postgres)
UPDATE keyhippo.api_key_metadata 
SET is_revoked = true 
WHERE user_id = 'user-uuid-here';
```

### Assigning Admin Role

To give a user admin privileges:

```sql
-- Get the admin group and role IDs
SELECT g.id as group_id, r.id as role_id 
FROM keyhippo_rbac.groups g 
JOIN keyhippo_rbac.roles r ON r.group_id = g.id 
WHERE g.name = 'Admin Group' AND r.name = 'Admin';

-- Assign the admin role to a user
SELECT keyhippo_rbac.assign_role_to_user(
  'user-uuid-here',
  'admin-group-uuid',
  'admin-role-uuid'
);
```

## Rate Limits

Currently, API key requests have the same rate limits as regular authenticated requests. Contact support if you need higher limits for your use case.

## Support

If you encounter issues with API keys, please:

1. Check this documentation first
2. Review the troubleshooting section
3. Contact support with your key ID (not the full key) and error messages

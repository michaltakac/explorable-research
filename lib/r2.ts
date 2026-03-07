import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { customAlphabet } from 'nanoid'
import { createHash } from 'crypto'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

// R2 client configured for CloudFlare R2 (S3-compatible)
function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'explorable-websites'

export function generateSubdomainSlug(title: string): string {
  // Sanitize title: lowercase, replace spaces with dashes, remove special chars
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-|-$/g, '') // trim leading/trailing dashes
    .substring(0, 25)

  // Ensure we have at least some characters from the title
  const prefix = sanitized || 'project'

  return `${prefix}-${nanoid()}`
}

export interface StaticFile {
  name: string
  content: string
}

export async function uploadStaticFiles(
  projectId: string,
  files: StaticFile[],
): Promise<void> {
  const client = getR2Client()

  const uploadPromises = files.map((file) => {
    const key = `projects/${projectId}/${file.name}`
    const contentType = getContentType(file.name)

    return client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.content,
        ContentType: contentType,
      }),
    )
  })

  await Promise.all(uploadPromises)
}

export async function deleteStaticFiles(projectId: string): Promise<void> {
  const client = getR2Client()

  // List all objects under the project prefix
  const listResponse = await client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `projects/${projectId}/`,
    }),
  )

  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    return // Nothing to delete
  }

  // Delete all objects
  await client.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
      },
    }),
  )
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'html':
      return 'text/html'
    case 'css':
      return 'text/css'
    case 'js':
      return 'application/javascript'
    case 'json':
      return 'application/json'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'svg':
      return 'image/svg+xml'
    case 'gif':
      return 'image/gif'
    case 'ico':
      return 'image/x-icon'
    default:
      return 'application/octet-stream'
  }
}

/**
 * Compute a hash of the combined file contents for version comparison.
 * Files are sorted by name to ensure consistent hashing.
 */
export function computeContentHash(files: StaticFile[]): string {
  // Sort files by name for consistent ordering
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name))

  // Combine all file contents with delimiters
  const combined = sortedFiles
    .map((f) => `---${f.name}---\n${f.content}`)
    .join('\n')

  // Create SHA-256 hash and return first 16 chars
  return createHash('sha256').update(combined).digest('hex').substring(0, 16)
}

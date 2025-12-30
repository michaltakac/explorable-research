import { supabase } from './supabase'
import { Database } from './database.types'
import { FragmentSchema } from './schema'
import { ExecutionResult } from './types'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']

/**
 * Save a fragment as a project to the database
 * Only works if user is authenticated
 */
export async function saveProject(
  fragment: FragmentSchema,
  result: ExecutionResult | undefined,
  userId: string,
  teamId?: string,
  modelInfo?: {
    provider: string
    name: string
  },
): Promise<{ id: string } | null> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping project save')
    return null
  }

  try {
    const projectData: ProjectInsert = {
      user_id: userId,
      team_id: teamId || null,
      title: fragment.title || 'Untitled Project',
      description: fragment.description || null,
      template: fragment.template || 'explorable-research-developer',
      code: fragment.code || '',
      file_path: fragment.file_path || null,
      port: fragment.port || null,
      additional_dependencies:
        fragment.additional_dependencies || ([] as unknown as any),
      model_provider: modelInfo?.provider || null,
      model_name: modelInfo?.name || null,
      sandbox_id: result?.sbxId || null,
      sandbox_url: result && 'url' in result ? result.url : null,
      execution_status: result && 'url' in result ? 'completed' : 'draft',
      is_published: false,
      published_url: null,
      short_url_id: null,
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Error saving project:', error)
      return null
    }

    console.log('Project saved successfully:', data.id)
    return { id: data.id }
  } catch (error) {
    console.error('Error in saveProject:', error)
    return null
  }
}

/**
 * Update a project in the database
 */
export async function updateProject(
  projectId: string,
  updates: Partial<ProjectInsert>,
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping project update')
    return false
  }

  try {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)

    if (error) {
      console.error('Error updating project:', error)
      return false
    }

    console.log('Project updated successfully:', projectId)
    return true
  } catch (error) {
    console.error('Error in updateProject:', error)
    return false
  }
}

/**
 * Delete a project from the database
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping project delete')
    return false
  }

  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      return false
    }

    console.log('Project deleted successfully:', projectId)
    return true
  } catch (error) {
    console.error('Error in deleteProject:', error)
    return false
  }
}

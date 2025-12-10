import { createOpenRouter } from '@openrouter/ai-sdk-provider'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { id: modelNameString } = model
  const { apiKey } = config

  // Use OpenRouter for all models - the model ID is in OpenRouter format (provider/model)
  const openrouter = createOpenRouter({
    apiKey: apiKey || process.env.OPENROUTER_API_KEY,
  })

  return openrouter(modelNameString)
}

import type { ProviderInfo } from '../types'

/**
 * Together AI provider information including all available models
 */
const togetheraiProvider: ProviderInfo = {
  id: 'togetherai',
  name: 'Together AI',
  icon: 'togetherai.svg',
  description: 'Together AI platform offering a variety of open source and proprietary models',
  languageModels: [
    {
      id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      name: 'Llama 3.3 70B Turbo',
      description: 'Turbo version of Llama 3.3 70B',
    },
    {
      id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      name: 'Llama 3.1 8B Turbo',
      description: 'Turbo version of Llama 3.1 8B',
    },
    {
      id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      name: 'Llama 3.1 70B Turbo',
      description: 'Turbo version of Llama 3.1 70B',
    },
    {
      id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      name: 'Llama 3.1 405B Turbo',
      description: 'Turbo version of Llama 3.1 405B',
    },
    {
      id: 'meta-llama/Meta-Llama-3-8B-Instruct-Turbo',
      name: 'Llama 3 8B Turbo',
      description: 'Turbo version of Llama 3 8B',
    },
    {
      id: 'meta-llama/Meta-Llama-3-70B-Instruct-Turbo',
      name: 'Llama 3 70B Turbo',
      description: 'Turbo version of Llama 3 70B',
    },
    {
      id: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
      name: 'Llama 3.2 3B Turbo',
      description: 'Turbo version of Llama 3.2 3B',
    },
    {
      id: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite',
      name: 'Llama 3 8B Lite',
      description: 'Lite version of Llama 3 8B',
    },
    {
      id: 'meta-llama/Meta-Llama-3-70B-Instruct-Lite',
      name: 'Llama 3 70B Lite',
      description: 'Lite version of Llama 3 70B',
    },
    {
      id: 'meta-llama/Llama-3-8b-chat-hf',
      name: 'Llama 3 8B Chat',
      description: 'Chat version of Llama 3 8B',
    },
    {
      id: 'meta-llama/Llama-3-70b-chat-hf',
      name: 'Llama 3 70B Chat',
      description: 'Chat version of Llama 3 70B',
    },
    {
      id: 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
      name: 'Nemotron 70B',
      description: 'NVIDIA Nemotron model',
    },
    {
      id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      name: 'Qwen 2.5 Coder 32B',
      description: 'Qwen coding model',
    },
    { id: 'Qwen/QwQ-32B-Preview', name: 'QwQ 32B', description: 'QwQ preview model' },
    {
      id: 'microsoft/WizardLM-2-8x22B',
      name: 'WizardLM 2',
      description: 'Microsoft WizardLM model',
    },
    { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', description: 'Google Gemma 2 27B model' },
    { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', description: 'Google Gemma 2 9B model' },
    { id: 'databricks/dbrx-instruct', name: 'DBRX', description: 'Databricks instruction model' },
    {
      id: 'deepseek-ai/deepseek-llm-67b-chat',
      name: 'DeepSeek 67B',
      description: 'DeepSeek chat model',
    },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'Latest DeepSeek model' },
    { id: 'google/gemma-2b-it', name: 'Gemma 2B', description: 'Google Gemma 2B model' },
    { id: 'Gryphe/MythoMax-L2-13b', name: 'MythoMax L2', description: 'MythoMax model' },
    {
      id: 'meta-llama/Llama-2-13b-chat-hf',
      name: 'Llama 2 13B',
      description: 'Llama 2 chat model',
    },
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.1',
      name: 'Mistral 7B v0.1',
      description: 'First version of Mistral',
    },
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.2',
      name: 'Mistral 7B v0.2',
      description: 'Second version of Mistral',
    },
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.3',
      name: 'Mistral 7B v0.3',
      description: 'Third version of Mistral',
    },
    {
      id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      name: 'Mixtral 8x7B',
      description: 'Mixtral instruction model',
    },
    {
      id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
      name: 'Mixtral 8x22B',
      description: 'Large Mixtral model',
    },
    {
      id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
      name: 'Nous Hermes 2',
      description: 'Nous Research model',
    },
    {
      id: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
      name: 'Qwen 2.5 7B Turbo',
      description: 'Fast Qwen model',
    },
    {
      id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      name: 'Qwen 2.5 72B Turbo',
      description: 'Large fast Qwen model',
    },
    { id: 'Qwen/Qwen2-72B-Instruct', name: 'Qwen 2 72B', description: 'Large Qwen 2 model' },
    {
      id: 'upstage/SOLAR-10.7B-Instruct-v1.0',
      name: 'SOLAR 10.7B',
      description: 'SOLAR instruction model',
    },
    { id: 'meta-llama/Llama-2-70b-hf', name: 'Llama 2 70B', description: 'Base Llama 2 model' },
    {
      id: 'mistralai/Mistral-7B-v0.1',
      name: 'Mistral 7B Base',
      description: 'Base Mistral model',
    },
    {
      id: 'mistralai/Mixtral-8x7B-v0.1',
      name: 'Mixtral 8x7B Base',
      description: 'Base large Mixtral model',
    },
    { id: 'Meta-Llama/Llama-Guard-7b', name: 'Llama Guard', description: 'Safety model' },
    {
      id: 'codellama/CodeLlama-34b-Instruct-hf',
      name: 'CodeLlama 34B',
      description: 'Code generation model',
    },
  ],
  textEmbeddingModels: [
    {
      id: 'togethercomputer/m2-bert-80M-2k-retrieval',
      name: 'M2 BERT 2K',
      description: '2K context BERT model',
      dimensions: 768,
    },
    {
      id: 'togethercomputer/m2-bert-80M-32k-retrieval',
      name: 'M2 BERT 32K',
      description: '32K context BERT model',
      dimensions: 768,
    },
    {
      id: 'togethercomputer/m2-bert-80M-8k-retrieval',
      name: 'M2 BERT 8K',
      description: '8K context BERT model',
      dimensions: 768,
    },
    {
      id: 'WhereIsAI/UAE-Large-V1',
      name: 'UAE Large',
      description: 'Large UAE model',
      dimensions: 1024,
    },
    {
      id: 'BAAI/bge-large-en-v1.5',
      name: 'BGE Large English',
      description: 'Large English BGE model',
      dimensions: 1024,
    },
    {
      id: 'BAAI/bge-base-en-v1.5',
      name: 'BGE Base English',
      description: 'Base English BGE model',
      dimensions: 768,
    },
    {
      id: 'sentence-transformers/msmarco-bert-base-dot-v5',
      name: 'MS MARCO BERT',
      description: 'MS MARCO search model',
      dimensions: 768,
    },
    {
      id: 'bert-base-uncased',
      name: 'BERT Base',
      description: 'Base BERT model',
      dimensions: 768,
    },
  ],
  imageModels: [
    {
      id: 'stabilityai/stable-diffusion-xl-base-1.0',
      name: 'SDXL Base',
      description: 'Base SDXL model',
    },
    {
      id: 'black-forest-labs/FLUX.1-dev',
      name: 'FLUX Dev',
      description: 'Development FLUX model',
    },
    {
      id: 'black-forest-labs/FLUX.1-dev-lora',
      name: 'FLUX Dev LoRA',
      description: 'FLUX with LoRA',
    },
    {
      id: 'black-forest-labs/FLUX.1-schnell',
      name: 'FLUX Schnell',
      description: 'Fast FLUX model',
    },
    {
      id: 'black-forest-labs/FLUX.1-canny',
      name: 'FLUX Canny',
      description: 'Edge detection model',
    },
    {
      id: 'black-forest-labs/FLUX.1-depth',
      name: 'FLUX Depth',
      description: 'Depth estimation model',
    },
    {
      id: 'black-forest-labs/FLUX.1-redux',
      name: 'FLUX Redux',
      description: 'Optimized FLUX model',
    },
    {
      id: 'black-forest-labs/FLUX.1.1-pro',
      name: 'FLUX 1.1 Pro',
      description: 'Professional FLUX model',
    },
    { id: 'black-forest-labs/FLUX.1-pro', name: 'FLUX Pro', description: 'Pro FLUX model' },
    {
      id: 'black-forest-labs/FLUX.1-schnell-Free',
      name: 'FLUX Schnell Free',
      description: 'Free fast FLUX model',
    },
  ],
}

export default togetheraiProvider

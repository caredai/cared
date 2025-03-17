import type { ProviderInfo } from '../types'

/**
 * DeepInfra provider information including all available models
 */
const deepinfraProvider: ProviderInfo = {
  id: 'deepinfra',
  name: 'DeepInfra',
  icon: 'deepinfra.png',
  description: 'DeepInfra platform offering a variety of open source models with optimized inference',
  languageModels: [
    {
      id: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
      name: 'Llama 3.1 405B',
      description: 'Largest Llama 3.1 model with 405B parameters',
    },
    {
      id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      name: 'Llama 3.1 70B',
      description: 'Llama 3.1 model with 70B parameters',
    },
    {
      id: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      name: 'Llama 3.1 8B',
      description: 'Llama 3.1 model with 8B parameters',
    },
    {
      id: 'meta-llama/Llama-3-70b-chat-hf',
      name: 'Llama 3 70B',
      description: 'Llama 3 model with 70B parameters',
    },
    {
      id: 'meta-llama/Llama-3-8b-chat-hf',
      name: 'Llama 3 8B',
      description: 'Llama 3 model with 8B parameters',
    },
    {
      id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      name: 'Mixtral 8x7B',
      description: 'Mixtral model with 8x7B parameters',
    },
    {
      id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
      name: 'Mixtral 8x22B',
      description: 'Mixtral model with 8x22B parameters',
    },
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.2',
      name: 'Mistral 7B v0.2',
      description: 'Mistral model with 7B parameters, version 0.2',
    },
    {
      id: 'codellama/CodeLlama-70b-Instruct-hf',
      name: 'CodeLlama 70B',
      description: 'CodeLlama model with 70B parameters',
    },
    {
      id: 'codellama/CodeLlama-34b-Instruct-hf',
      name: 'CodeLlama 34B',
      description: 'CodeLlama model with 34B parameters',
    },
    {
      id: 'codellama/CodeLlama-13b-Instruct-hf',
      name: 'CodeLlama 13B',
      description: 'CodeLlama model with 13B parameters',
    },
    {
      id: 'codellama/CodeLlama-7b-Instruct-hf',
      name: 'CodeLlama 7B',
      description: 'CodeLlama model with 7B parameters',
    },
    {
      id: 'google/gemma-7b-it',
      name: 'Gemma 7B',
      description: 'Google Gemma model with 7B parameters',
    },
    {
      id: 'google/gemma-2b-it',
      name: 'Gemma 2B',
      description: 'Google Gemma model with 2B parameters',
    },
    {
      id: 'NousResearch/Nous-Hermes-2-Yi-34B',
      name: 'Nous Hermes 2 Yi 34B',
      description: 'Nous Research model based on Yi with 34B parameters',
    },
    {
      id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
      name: 'Nous Hermes 2 Mixtral',
      description: 'Nous Research model based on Mixtral with 8x7B parameters',
    },
    {
      id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT',
      name: 'Nous Hermes 2 Mixtral SFT',
      description: 'Nous Research SFT model based on Mixtral with 8x7B parameters',
    },
    {
      id: 'openchat/openchat-3.5-0106',
      name: 'OpenChat 3.5',
      description: 'OpenChat model version 3.5',
    },
    {
      id: 'Qwen/Qwen1.5-72B-Chat',
      name: 'Qwen 1.5 72B',
      description: 'Qwen 1.5 model with 72B parameters',
    },
    {
      id: 'Qwen/Qwen1.5-14B-Chat',
      name: 'Qwen 1.5 14B',
      description: 'Qwen 1.5 model with 14B parameters',
    },
    {
      id: 'Qwen/Qwen1.5-7B-Chat',
      name: 'Qwen 1.5 7B',
      description: 'Qwen 1.5 model with 7B parameters',
    },
    {
      id: 'Qwen/Qwen1.5-4B-Chat',
      name: 'Qwen 1.5 4B',
      description: 'Qwen 1.5 model with 4B parameters',
    },
    {
      id: 'Qwen/Qwen1.5-1.8B-Chat',
      name: 'Qwen 1.5 1.8B',
      description: 'Qwen 1.5 model with 1.8B parameters',
    },
    {
      id: 'meta-llama/Llama-2-70b-chat-hf',
      name: 'Llama 2 70B',
      description: 'Llama 2 model with 70B parameters',
    },
    {
      id: 'meta-llama/Llama-2-13b-chat-hf',
      name: 'Llama 2 13B',
      description: 'Llama 2 model with 13B parameters',
    },
    {
      id: 'meta-llama/Llama-2-7b-chat-hf',
      name: 'Llama 2 7B',
      description: 'Llama 2 model with 7B parameters',
    },
  ],
  textEmbeddingModels: [
    {
      id: 'BAAI/bge-large-en-v1.5',
      name: 'BGE Large English v1.5',
      description: 'BGE large English embedding model',
      dimensions: 1024,
    },
    {
      id: 'BAAI/bge-base-en-v1.5',
      name: 'BGE Base English v1.5',
      description: 'BGE base English embedding model',
      dimensions: 768,
    },
    {
      id: 'BAAI/bge-small-en-v1.5',
      name: 'BGE Small English v1.5',
      description: 'BGE small English embedding model',
      dimensions: 384,
    },
  ],
  imageModels: [
    {
      id: 'stabilityai/stable-diffusion-xl-base-1.0',
      name: 'SDXL 1.0',
      description: 'Stable Diffusion XL base model',
    },
    {
      id: 'stabilityai/stable-diffusion-2-1-base',
      name: 'SD 2.1',
      description: 'Stable Diffusion 2.1 base model',
    },
  ],
}

export default deepinfraProvider

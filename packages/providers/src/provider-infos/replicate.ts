import type { ProviderInfo } from '../types'

/**
 * Replicate provider information including all available models
 */
const replicateProvider: ProviderInfo = {
  id: 'replicate',
  name: 'Replicate',
  icon: 'replicate.svg',
  description: 'Replicate platform offering a wide variety of open source models',
  languageModels: [
    {
      id: 'meta/meta-llama-3-70b-instruct:dd58944',
      name: 'Llama 3 70B',
      description: 'Meta Llama 3 model with 70B parameters',
    },
    {
      id: 'meta/meta-llama-3-8b-instruct:dd58944',
      name: 'Llama 3 8B',
      description: 'Meta Llama 3 model with 8B parameters',
    },
    {
      id: 'meta/meta-llama-3.1-8b-instruct:dae3a34',
      name: 'Llama 3.1 8B',
      description: 'Meta Llama 3.1 model with 8B parameters',
    },
    {
      id: 'meta/meta-llama-3.1-70b-instruct:dae3a34',
      name: 'Llama 3.1 70B',
      description: 'Meta Llama 3.1 model with 70B parameters',
    },
    {
      id: 'meta/meta-llama-3.1-405b-instruct:dae3a34',
      name: 'Llama 3.1 405B',
      description: 'Meta Llama 3.1 model with 405B parameters',
    },
    {
      id: 'mistralai/mixtral-8x7b-instruct-v0.1:cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca3e4b77c3d93ed760',
      name: 'Mixtral 8x7B',
      description: 'Mixtral model with 8x7B parameters',
    },
    {
      id: 'mistralai/mistral-7b-instruct-v0.2:7e5afe4f1f35c16c38c5abc8a801d cbdaac47f95f1c1b6d6390e3171fd31c',
      name: 'Mistral 7B v0.2',
      description: 'Mistral model with 7B parameters, version 0.2',
    },
    {
      id: 'anthropic/claude-3-opus-20240229:b28d9b9b-bf93-4b76-b06e-b0dc0a7cbe5a',
      name: 'Claude 3 Opus',
      description: 'Anthropic Claude 3 Opus model',
    },
    {
      id: 'anthropic/claude-3-sonnet-20240229:7d4c4b06-c542-4127-a395-fd02c5652d9a',
      name: 'Claude 3 Sonnet',
      description: 'Anthropic Claude 3 Sonnet model',
    },
    {
      id: 'anthropic/claude-3-haiku-20240307:7e5b7e76-fcd0-42f4-9d24-96491a95d0ef',
      name: 'Claude 3 Haiku',
      description: 'Anthropic Claude 3 Haiku model',
    },
    {
      id: 'anthropic/claude-2.1:8842e7c21fd8b8e1d9fa7e7ce594c1f7c5b8e0c8a7b5da4b7bf0f2843bdff2b4',
      name: 'Claude 2.1',
      description: 'Anthropic Claude 2.1 model',
    },
    {
      id: 'anthropic/claude-2.0:7488d4e9e2c27695c9c6b5743e953a3e7c146b6399e88829eef2c8aa9f8b6b84',
      name: 'Claude 2.0',
      description: 'Anthropic Claude 2.0 model',
    },
    {
      id: 'anthropic/claude-instant-1.2:2d44b4dc3eecb2b9702f6c0d0dbef3bd5af1d2de37c45e3d0124d69bef9ffcaf',
      name: 'Claude Instant 1.2',
      description: 'Anthropic Claude Instant 1.2 model',
    },
    {
      id: 'stability-ai/stablelm-zephyr-3b:7b3212fbdaaa9e1b8a7bee9d3a83fab0d0e3ecb00d1a9a435f8c690dec4ba1d3',
      name: 'StableLM Zephyr 3B',
      description: 'Stability AI StableLM Zephyr model with 3B parameters',
    },
    {
      id: 'a16z-infra/llama-2-13b-chat:2a7f981751ec7fdf87b5b91ad4db53683a98082e9ff7bfd12c8cd5ea85980a52',
      name: 'Llama 2 13B',
      description: 'Meta Llama 2 model with 13B parameters',
    },
    {
      id: 'meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3',
      name: 'Llama 2 70B',
      description: 'Meta Llama 2 model with 70B parameters',
    },
    {
      id: 'meta/llama-2-7b-chat:13c3cdee13ee059ab779f0291d29054dab00a47dad8261375654de5540165fb0',
      name: 'Llama 2 7B',
      description: 'Meta Llama 2 model with 7B parameters',
    },
    {
      id: 'replicate/llama-2-70b-chat:58d078176e02c219e11eb4da5a02a7830a283b14cf8f94537af893ccff5ee781',
      name: 'Llama 2 70B (Replicate)',
      description: 'Replicate-hosted Llama 2 model with 70B parameters',
    },
  ],
  textEmbeddingModels: [],
  imageModels: [
    {
      id: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      name: 'SDXL',
      description: 'Stable Diffusion XL model',
    },
    {
      id: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
      name: 'Stable Diffusion',
      description: 'Stable Diffusion model',
    },
    {
      id: 'stability-ai/stable-diffusion-xl-base-1.0:7ccb66c58a2214f03a1a9b3d1c6a8a9f45b48abf1c5f8d6ad518a4eb3e7d1f7c',
      name: 'SDXL Base 1.0',
      description: 'Stable Diffusion XL Base 1.0 model',
    },
    {
      id: 'lucataco/sdxl-lightning-4step:727e49a643e999d602a896c774a0658148cdc573d2d865f8cb6a3c7c1e9cebfa',
      name: 'SDXL Lightning',
      description: 'Fast SDXL model with 4-step inference',
    },
    {
      id: 'lucataco/dreamshaper-xl-turbo:9e3486b6d3b6fcda816865c4b0be5ab3a3d101de3c95f1101b3b1b339f6f3e3f',
      name: 'DreamShaper XL Turbo',
      description: 'Fast DreamShaper XL model',
    },
    {
      id: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
      name: 'SDXL Emoji',
      description: 'SDXL model fine-tuned for emoji generation',
    },
    {
      id: 'lucataco/animate-diff:4f4d38e36c0a2fc5de32d7dec3e64d4e0a9a9e05a3c2e92a446dec1da2cdf43f',
      name: 'AnimateDiff',
      description: 'Model for generating animated images',
    },
    {
      id: 'cjwbw/anything-v3-better-vae:f1c7e9fe52a6d12c7a2c3b9ff9702aaa3f137f7b8d38a8fdb84e6d78764a1e48',
      name: 'Anything V3',
      description: 'Anything V3 model with better VAE',
    },
    {
      id: 'cjwbw/anything-v4.0:42a996d39a96aedc57b2e0aa8105dea39c9c89d9d266caf6bb4327a1c191b061',
      name: 'Anything V4',
      description: 'Anything V4 model',
    },
    {
      id: 'cjwbw/dreamlike-diffusion-1.0:5c9d5b06deeec830d93a8ed58c7b94723756dd9c9de02553216a1fad6fee8e96',
      name: 'Dreamlike Diffusion',
      description: 'Dreamlike Diffusion model',
    },
    {
      id: 'cjwbw/openjourney:ad59ca21177f9e217b9075e7300cf6e14f7e5b4505b66fad2c8a043b3dfc49e6',
      name: 'OpenJourney',
      description: 'OpenJourney model',
    },
    {
      id: 'cjwbw/realistic-vision-v1.3:9e6701e575a0a6d1be0576f8d5f9417cb0c64556e8b6f36f73f0666b0a1c1f2b',
      name: 'Realistic Vision V1.3',
      description: 'Realistic Vision model version 1.3',
    },
    {
      id: 'cjwbw/realistic-vision-v2.0:4e7a3dfd26d3c5315a8e9ca4f5b15f154c381e56cf208a3bce2d7b4b3e9f5142',
      name: 'Realistic Vision V2.0',
      description: 'Realistic Vision model version 2.0',
    },
    {
      id: 'cjwbw/realistic-vision-v3:c0be67987d0593e02308b5471fe5dd3c61a879f0f457878e3cdd3b7cc9c9f9b7',
      name: 'Realistic Vision V3',
      description: 'Realistic Vision model version 3',
    },
    {
      id: 'cjwbw/realistic-vision-v4:2ce47aee7f0d3fa2e2f1df4e5d3d36e0a196b87c172f219b4433b0be5801d1ff',
      name: 'Realistic Vision V4',
      description: 'Realistic Vision model version 4',
    },
    {
      id: 'cjwbw/rev-animated:8b1b897c-d6bb-47fc-8b2c-c9a2e9c8b033',
      name: 'Rev Animated',
      description: 'Model for generating animated content',
    },
  ],
}

export default replicateProvider 
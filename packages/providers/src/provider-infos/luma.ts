import type { ProviderInfo } from '../types'

/**
 * Luma AI provider information including all available models
 */
const lumaProvider: ProviderInfo = {
  id: 'luma',
  name: 'Luma AI',
  icon: 'luma.svg',
  description: 'Luma AI platform specializing in video generation and 3D content creation',
  languageModels: [],
  textEmbeddingModels: [],
  imageModels: [
    {
      id: 'lumalabs/luma-video-xl',
      name: 'Luma Video XL',
      description: 'High-quality video generation model',
    },
    {
      id: 'lumalabs/luma-video-hd',
      name: 'Luma Video HD',
      description: 'High-definition video generation model',
    },
    {
      id: 'lumalabs/luma-video-realistic',
      name: 'Luma Video Realistic',
      description: 'Realistic video generation model',
    },
    {
      id: 'lumalabs/luma-video-stylized',
      name: 'Luma Video Stylized',
      description: 'Stylized video generation model',
    },
    {
      id: 'lumalabs/luma-video-cinematic',
      name: 'Luma Video Cinematic',
      description: 'Cinematic video generation model',
    },
    {
      id: 'lumalabs/luma-video-animation',
      name: 'Luma Video Animation',
      description: 'Animated video generation model',
    },
  ],
}

export default lumaProvider

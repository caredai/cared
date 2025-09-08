import type { ProviderInfo } from '../types'

/**
 * Google AI provider information including all available Gemini models
 */
const googleProvider: ProviderInfo = {
  id: 'google',
  name: 'Google AI',
  icon: 'gemini.svg',
  description: 'Google AI services including Gemini models',
  languageModels: [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description:
        'State-of-the-art thinking model, capable of reasoning over complex problems in code, math, and STEM, as well as analyzing large datasets, codebases, and documents using long context.',
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      inputTokenPrice: '1.25',
      cachedInputTokenPrice: '0.31',
      outputTokenPrice: '10.00',
      modality: {
        input: ['text', 'image', 'video', 'audio', 'pdf'],
        output: ['text'],
      },
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description:
        'Best model in terms of price-performance, offering well-rounded capabilities. Best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.',
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      inputTokenPrice: '0.30',
      cachedInputTokenPrice: '0.075',
      outputTokenPrice: '2.50',
      modality: {
        input: ['text', 'image', 'video', 'audio'],
        output: ['text'],
      },
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash-Lite',
      description: 'A Gemini 2.5 Flash model optimized for cost-efficiency and high throughput.',
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      inputTokenPrice: '0.10',
      cachedInputTokenPrice: '0.025',
      outputTokenPrice: '0.40',
      modality: {
        input: ['text', 'image', 'video', 'audio', 'pdf'],
        output: ['text'],
      },
    },
    {
      id: 'gemini-live-2.5-flash-preview',
      name: 'Gemini 2.5 Flash Live',
      description:
        'Works with the Live API to enable low-latency bidirectional voice and video interactions with Gemini. Can process text, audio, and video input, and provide text and audio output.',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      inputTokenPrice: '0.50',
      outputTokenPrice: '2.00',
      modality: {
        input: ['text', 'audio', 'video'],
        output: ['text', 'audio'],
      },
    },
    {
      id: 'gemini-2.5-flash-preview-native-audio-dialog',
      name: 'Gemini 2.5 Flash Native Audio',
      description:
        'Native audio dialog models, with and without thinking, available through the Live API. Provide interactive and unstructured conversational experiences, with style and control prompting.',
      contextWindow: 128000,
      maxOutputTokens: 8000,
      inputTokenPrice: '0.50',
      outputTokenPrice: '2.00',
      modality: {
        input: ['text', 'audio', 'video'],
        output: ['text', 'audio'],
      },
    },
    {
      id: 'gemini-2.5-flash-image-preview',
      name: 'Gemini 2.5 Flash Image Preview',
      description:
        'Latest, fastest, and most efficient natively multimodal model that lets you generate and edit images conversationally.',
      contextWindow: 32768,
      maxOutputTokens: 32768,
      inputTokenPrice: '0.30',
      outputTokenPrice: '30.00', // TODO: imageOutputTokenPrice
      modality: {
        input: ['text', 'image'],
        output: ['text', 'image'],
      },
    },
    {
      id: 'gemini-2.5-flash-preview-tts',
      name: 'Gemini 2.5 Flash Preview TTS',
      description:
        'Price-performant text-to-speech model, delivering high control and transparency for structured workflows like podcast generation, audiobooks, customer support, and more.',
      contextWindow: 8000,
      maxOutputTokens: 16000,
      inputTokenPrice: '0.50',
      outputTokenPrice: '10.00',
      modality: {
        input: ['text'],
        output: ['audio'],
      },
    },
    {
      id: 'gemini-2.5-pro-preview-tts',
      name: 'Gemini 2.5 Pro Preview TTS',
      description:
        'Most powerful text-to-speech model, delivering high control and transparency for structured workflows like podcast generation, audiobooks, customer support, and more.',
      contextWindow: 8000,
      maxOutputTokens: 16000,
      inputTokenPrice: '1.00',
      outputTokenPrice: '20.00',
      modality: {
        input: ['text'],
        output: ['audio'],
      },
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description:
        'Delivers next-gen features and improved capabilities, including superior speed, native tool use, and a 1M token context window. Built for the era of Agents.',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      inputTokenPrice: '0.10',
      cachedInputTokenPrice: '0.025',
      outputTokenPrice: '0.40',
      modality: {
        input: ['text', 'image', 'video', 'audio'],
        output: ['text'],
      },
    },
    {
      id: 'gemini-2.0-flash-preview-image-generation',
      name: 'Gemini 2.0 Flash Preview Image Generation',
      description:
        'Delivers improved image generation features, including generating and editing images conversationally.',
      contextWindow: 32000,
      maxOutputTokens: 8192,
      inputTokenPrice: '0.10',
      outputTokenPrice: '30.00', // TODO: imageOutputTokenPrice
      modality: {
        input: ['text', 'image', 'video', 'audio'],
        output: ['text', 'image'],
      },
    },
    {
      id: 'gemini-2.0-flash-lite',
      name: 'Gemini 2.0 Flash-Lite',
      description: 'A Gemini 2.0 Flash model optimized for cost efficiency and low latency.',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      inputTokenPrice: '0.075',
      outputTokenPrice: '0.30',
      modality: {
        input: ['text', 'image', 'video', 'audio'],
        output: ['text'],
      },
    },
    {
      id: 'gemini-2.0-flash-live-001',
      name: 'Gemini 2.0 Flash Live',
      description:
        'Works with the Live API to enable low-latency bidirectional voice and video interactions with Gemini. Can process text, audio, and video input, and provide text and audio output.',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      inputTokenPrice: '0.35',
      outputTokenPrice: '1.50',
      modality: {
        input: ['text', 'audio', 'video'],
        output: ['text', 'audio'],
      },
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Fast and versatile multimodal model for scaling across diverse tasks.',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      inputTokenPrice: '0.075',
      cachedInputTokenPrice: '0.01875',
      outputTokenPrice: '0.30',
      modality: {
        input: ['text', 'image', 'video', 'audio'],
        output: ['text'],
      },
      deprecated: true,
    },
    {
      id: 'gemini-1.5-flash-8b',
      name: 'Gemini 1.5 Flash-8B',
      description: 'Small model designed for lower intelligence tasks.',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      inputTokenPrice: '0.0375',
      cachedInputTokenPrice: '0.01',
      outputTokenPrice: '0.15',
      modality: {
        input: ['text', 'image', 'video', 'audio'],
        output: ['text'],
      },
      deprecated: true,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description:
        'Mid-size multimodal model that is optimized for a wide-range of reasoning tasks. Can process large amounts of data at once, including 2 hours of video, 19 hours of audio, codebases with 60,000 lines of code, or 2,000 pages of text.',
      contextWindow: 2097152,
      maxOutputTokens: 8192,
      inputTokenPrice: '1.25',
      cachedInputTokenPrice: '0.3125',
      outputTokenPrice: '5.00',
      modality: {
        input: ['text', 'image', 'video', 'audio'],
        output: ['text'],
      },
      deprecated: true,
    },
    {
      id: 'gemma-3n-e2b-it',
      name: 'Gemma 3n E2B',
      description: '',
    },
    {
      id: 'gemma-3n-e4b-it',
      name: 'Gemma 3n E4B',
      description: '',
    },
    {
      id: 'gemma-3-1b-it',
      name: 'Gemma 3 1B',
      description: '',
    },
    {
      id: 'gemma-3-4b-it',
      name: 'Gemma 3 4B',
      description: '',
    },
    {
      id: 'gemma-3-12b-it',
      name: 'Gemma 3 12B',
      description: '',
    },
    {
      id: 'gemma-3-27b-it',
      name: 'Gemma 3 27B',
      description: '',
    },
  ],
  imageModels: [
    {
      id: 'imagen-4.0-ultra-generate-001',
      name: 'Imagen 4 Ultra',
      description:
        'Latest image generation model, with significantly better text rendering and better overall image quality.',
      pricePerImage: '0.06',
    },
    {
      id: 'imagen-4.0-generate-001',
      name: 'Imagen 4 Standard',
      description:
        'Latest image generation model, with significantly better text rendering and better overall image quality.',
      pricePerImage: '0.04',
    },
    {
      id: 'imagen-4.0-fast-generate-001',
      name: 'Imagen 4 Fast',
      description:
        'Latest image generation model, with significantly better text rendering and better overall image quality.',
      pricePerImage: '0.02',
    },
    {
      id: 'imagen-3.0-generate-002',
      name: 'Imagen 3',
      description: 'State-of-the-art image generation model.',
      pricePerImage: '0.03',
    },
  ],
  textEmbeddingModels: [
    {
      id: 'gemini-embedding-001',
      name: 'Gemini Embedding',
      description:
        'Newest embeddings model, more stable and with higher rate limits than previous versions.',
      tokenPrice: '0.15',
      dimensions: [768, 1536, 3072],
    },
  ],
}

export default googleProvider

import type { ProviderInfo } from '../types'

const falProvider: ProviderInfo = {
  id: 'fal',
  name: 'Fal',
  icon: 'fal.svg',
  description:
    'Fal AI provides a generative media platform for developers with lightning-fast inference capabilities. Their platform offers optimized performance for running diffusion models, with speeds up to 4x faster than alternatives.',
  imageModels: [
    // https://fal.ai/models/fal-ai/flux-pro/kontext
    {
      id: 'fal-ai/flux-pro/kontext',
      name: 'FLUX.1 Kontext [pro] | Image to Image',
      description:
        'FLUX.1 Kontext [pro] handles both text and reference images as inputs, seamlessly enabling targeted, local edits and complex transformations of entire scenes.',
      pricePerImage: '0.04',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/kontext/text-to-image',
      name: 'FLUX.1 Kontext [pro] | Text to Image',
      description:
        'The FLUX.1 Kontext [pro] text-to-image delivers state-of-the-art image generation results with unprecedented prompt following, photorealistic rendering, and flawless typography.',
      pricePerImage: '0.04',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/kontext/multi',
      name: 'FLUX.1 Kontext [pro] | Multi Image to Image',
      description:
        'Experimental version of FLUX.1 Kontext [pro] with multi image handling capabilities',
      pricePerImage: '0.04',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/kontext/max',
      name: 'FLUX.1 Kontext [max] | Image to Image',
      description:
        'FLUX.1 Kontext [max] is a model with greatly improved prompt adherence and typography generation meet premium consistency for editing without compromise on speed.',
      pricePerImage: '0.08',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/kontext/max/text-to-image',
      name: 'FLUX.1 Kontext [max] | Text to Image',
      description:
        'FLUX.1 Kontext [max] text-to-image is a new premium model brings maximum performance across all aspects – greatly improved prompt adherence.',
      pricePerImage: '0.08',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/kontext/max/multi',
      name: 'FLUX.1 Kontext [max] | Multi Image to Image',
      description:
        'Experimental version of FLUX.1 Kontext [max] with multi image handling capabilities',
      pricePerImage: '0.08',
      chargeable: true,
    },
    // https://fal.ai/models/fal-ai/flux/dev
    {
      id: 'fal-ai/flux/dev',
      name: 'FLUX.1 [dev] | Text to Image',
      description:
        'FLUX.1 [dev] is a 12 billion parameter flow transformer that generates high-quality images from text. It is suitable for personal and commercial use.',
      imageOutputTokenPrice: '0.025',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux/dev/image-to-image',
      name: 'FLUX.1 [dev] | Image to Image',
      description:
        'FLUX.1 Image-to-Image is a high-performance endpoint for the FLUX.1 [dev] model that enables rapid transformation of existing images, delivering high-quality style transfers and image modifications with the core FLUX capabilities.',
      imageOutputTokenPrice: '0.03',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux/dev/redux',
      name: 'FLUX.1 [dev] | Image to Image Redux',
      description:
        'FLUX.1 [dev] Redux is a high-performance endpoint for the FLUX.1 [dev] model that enables rapid transformation of existing images, delivering high-quality style transfers and image modifications with the core FLUX capabilities.',
      imageOutputTokenPrice: '0.025',
      chargeable: true,
    },
    // https://fal.ai/models/fal-ai/flux/schnell
    {
      id: 'fal-ai/flux/schnell',
      name: 'FLUX.1 [schnell] | Text to Image',
      description:
        'FLUX.1 [schnell] is a 12 billion parameter flow transformer that generates high-quality images from text in 1 to 4 steps, suitable for personal and commercial use.',
      imageOutputTokenPrice: '0.03',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux/schnell/redux',
      name: 'FLUX.1 [schnell] | Image to Image Redux',
      description:
        'FLUX.1 [schnell] Redux is a high-performance endpoint for the FLUX.1 [schnell] model that enables rapid transformation of existing images, delivering high-quality style transfers and image modifications with the core FLUX capabilities.',
      imageOutputTokenPrice: '0.025',
      chargeable: true,
    },
    // https://fal.ai/models/fal-ai/flux-pro/new
    {
      id: 'fal-ai/flux-pro/new',
      name: 'FLUX.1 [pro] (new)',
      description:
        'FLUX.1 [pro] new is an accelerated version of FLUX.1 [pro], maintaining professional-grade image quality while delivering significantly faster generation speeds.',
      imageOutputTokenPrice: '0.05',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1.1',
      name: 'FLUX 1.1 [pro]',
      description:
        'FLUX1.1 [pro] is an enhanced version of FLUX.1 [pro], improved image generation capabilities, delivering superior composition, detail, and artistic fidelity compared to its predecessor.',
      imageOutputTokenPrice: '0.04',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1.1-ultra',
      name: 'FLUX 1.1 [pro] (ultra)',
      description:
        'FLUX1.1 [pro] ultra is the newest version of FLUX1.1 [pro], maintaining professional-grade image quality while delivering up to 2K resolution with improved photo realism.',
      imageOutputTokenPrice: '0.06',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1.1-ultra-finetuned',
      name: 'FLUX 1.1 [pro] (ultra) Fine-tuned',
      description:
        'FLUX1.1 [pro] ultra fine-tuned is the newest version of FLUX1.1 [pro] with a fine-tuned LoRA, maintaining professional-grade image quality while delivering up to 2K resolution with improved photo realism.',
      imageOutputTokenPrice: '0.07',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1.1-ultra/redux',
      name: 'FLUX 1.1 [pro] (ultra) Redux',
      description:
        'FLUX1.1 [pro] ultra Redux is a high-performance endpoint for the FLUX1.1 [pro] model that enables rapid transformation of existing images, delivering high-quality style transfers and image modifications with the core FLUX capabilities.',
      imageOutputTokenPrice: '0.05',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1.1/redux',
      name: 'FLUX 1.1 [pro] Redux',
      description:
        'FLUX1.1 [pro] Redux is a high-performance endpoint for the FLUX1.1 [pro] model that enables rapid transformation of existing images, delivering high-quality style transfers and image modifications with the core FLUX capabilities.',
      imageOutputTokenPrice: '0.05',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1/canny',
      name: 'FLUX.1 [pro] Canny',
      description:
        'Utilize Flux.1 [pro] Controlnet to generate high-quality images with precise control over composition, style, and structure through advanced edge detection and guidance mechanisms.',
      imageOutputTokenPrice: '0.05',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1/canny-finetuned',
      name: 'FLUX.1 [pro] Canny Fine-tuned',
      description:
        'Utilize Flux.1 [pro] Controlnet with a fine-tuned LoRA to generate high-quality images with precise control over composition, style, and structure through advanced edge detection and guidance mechanisms.',
      imageOutputTokenPrice: '0.06',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1/depth',
      name: 'FLUX.1 [pro] Depth',
      description:
        'Generate high-quality images from depth maps using Flux.1 [pro] depth estimation model. The model produces accurate depth representations for scene understanding and 3D visualization.',
      imageOutputTokenPrice: '0.05',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1/depth-finetuned',
      name: 'FLUX.1 [pro] Depth Fine-tuned',
      description:
        'Generate high-quality images from depth maps using Flux.1 [pro] depth estimation model with a fine-tuned LoRA. The model produces accurate depth representations for scene understanding and 3D visualization.',
      imageOutputTokenPrice: '0.06',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1/fill',
      name: 'FLUX.1 [pro] Fill',
      description:
        'FLUX.1 [pro] Fill is a high-performance endpoint for the FLUX.1 [pro] model that enables rapid transformation of existing images, delivering high-quality style transfers and image modifications with the core FLUX capabilities.',
      imageOutputTokenPrice: '0.05',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1/fill-finetuned',
      name: 'FLUX.1 [pro] Fill Fine-tuned',
      description:
        'FLUX.1 [pro] Fill Fine-tuned is a high-performance endpoint for the FLUX.1 [pro] model with a fine-tuned LoRA that enables rapid transformation of existing images, delivering high-quality style transfers and image modifications with the core FLUX capabilities.',
      imageOutputTokenPrice: '0.06',
      chargeable: true,
    },
    {
      id: 'fal-ai/flux-pro/v1/redux',
      name: 'FLUX.1 [pro] Redux',
      description:
        'FLUX.1 [pro] Redux is a high-performance endpoint for the FLUX.1 [pro] model that enables rapid transformation of existing images, delivering high-quality style transfers and image modifications with the core FLUX capabilities.',
      imageOutputTokenPrice: '0.05',
      chargeable: true,
    },
    // https://fal.ai/models/fal-ai/stable-diffusion-v3-medium
    {
      id: 'fal-ai/stable-diffusion-v3-medium',
      name: 'Stable Diffusion 3 Medium',
      description:
        'Stable Diffusion 3 Medium (Text to Image) is a Multimodal Diffusion Transformer (MMDiT) model that improves image quality, typography, prompt understanding, and efficiency.',
      pricePerImage: '0.035',
      chargeable: true,
    },
    // https://fal.ai/models/fal-ai/nano-banana
    {
      id: 'fal-ai/nano-banana',
      name: 'Nano Banana',
      description: "Google's state-of-the-art image generation and editing model",
      pricePerImage: '0.039',
      chargeable: true,
    },
    {
      id: 'fal-ai/nano-banana/edit',
      name: 'Nano Banana Edit',
      description: "Google's state-of-the-art image generation and editing model",
      pricePerImage: '0.039',
      chargeable: true,
    },
    // https://fal.ai/models/fal-ai/imagen4/preview
    {
      id: 'fal-ai/imagen4/preview',
      name: 'Imagen 4 Standard',
      description: 'Balanced quality and performance for general image generation needs.',
      pricePerImage: '0.05',
      chargeable: true,
    },
    {
      id: 'fal-ai/imagen4/preview/fast',
      name: 'Imagen 4 Fast',
      description: 'Cost-effective option with best quality per dollar for high-volume usage.',
      pricePerImage: '0.04',
      chargeable: true,
    },
    {
      id: 'fal-ai/imagen4/preview/ultra',
      name: 'Imagen 4 Ultra',
      description:
        'Highest quality for professional needs with superior image generation capabilities.',
      pricePerImage: '0.06',
      chargeable: true,
    },
  ],
}

export default falProvider

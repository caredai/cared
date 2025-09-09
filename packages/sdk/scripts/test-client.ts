import { writeFileSync } from 'fs'
import { join } from 'path'
import { experimental_generateImage as generateImage, generateText, streamText } from 'ai'
import mime from 'mime'

import { CaredClient } from '../src/client'

async function main() {
  // Read configuration from environment variables
  const apiUrl = process.env.API_URL || 'https://localhost:3000'
  const apiKey = process.env.API_KEY

  if (!apiUrl || !apiKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   API_URL - The API endpoint URL')
    console.error('   API_KEY - The API key for authentication')
    console.error('')
    console.error('Example:')
    console.error('   API_URL=https://localhost:3000 API_KEY=your-key pnpm test-client')
    process.exit(1)
  }

  console.log('🚀 Starting SDK client test...')
  console.log(`📍 API URL: ${apiUrl}`)
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`)

  // Initialize the CaredClient
  const client = new CaredClient({
    apiUrl,
    apiKey,
  })

  // Test with a common language model (adjust modelId as needed)
  const modelId = 'openai:gpt-4.1-mini' // You can change this to any supported model
  console.log(`🤖 Testing with model: ${modelId}`)

  // Create language model
  const languageModel = await client.createLanguageModel(modelId)
  console.log('✅ Language model created successfully')

  // Test 1: Generate text (non-streaming)
  console.log('\n📝 Testing generateText...')
  const generateResult = await generateText({
    model: languageModel,
    messages: [
      {
        role: 'user',
        content: 'Hello! Please respond with a short greeting.',
      },
    ],
    maxOutputTokens: 100,
    temperature: 0.7,
  })

  console.log('✅ generateText completed successfully')
  console.log(`📄 Response: ${generateResult.text}`)
  console.log(`📊 Usage: ${JSON.stringify(generateResult.usage)}`)

  // Test 2: Stream text
  console.log('\n🌊 Testing streamText...')
  const streamResult = streamText({
    model: languageModel,
    messages: [
      {
        role: 'user',
        content: 'Count from 1 to 5, with each number on a new line.',
      },
    ],
    maxOutputTokens: 50,
    temperature: 0.3,
  })

  console.log('✅ streamText started successfully')
  console.log('📄 Streaming response:')

  // Process the stream
  for await (const delta of streamResult.textStream) {
    process.stdout.write(delta)
  }

  console.log('\n✅ streamText completed successfully')
  console.log(`📊 Final usage: ${JSON.stringify(await streamResult.totalUsage)}`)

  // Test 3: Generate image
  console.log('\n🖼️ Testing image generation...')
  const imageModelId = 'openai:dall-e-2'
  console.log(`🎨 Testing with image model: ${imageModelId}`)

  // Create image model
  const imageModel = await client.createImageModel(imageModelId)
  console.log('✅ Image model created successfully')

  // Generate image
  const imageResult = await generateImage({
    model: imageModel,
    prompt: 'A futuristic cityscape at sunset',
    n: 1,
    providerOptions: {
      openai: {
        // quality: 'standard',
        size: '256x256',
      },
    },
  })

  console.log('✅ Image generation completed successfully')
  console.log(`🖼️ Generated ${imageResult.images.length} image(s)`)
  console.log(`📊 Provider metadata: ${JSON.stringify(imageResult.providerMetadata)}`)

  // Save generated images to current directory
  console.log('\n💾 Saving images to current directory...')
  for (let i = 0; i < imageResult.images.length; i++) {
    const image = imageResult.images[i]
    const filename = `generated-image-${Date.now()}-${i + 1}.${mime.getExtension(image.mediaType) || 'png'}`
    const filepath = join(process.cwd(), filename)

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(image.base64, 'base64')
    writeFileSync(filepath, imageBuffer)

    console.log(`✅ Image ${i + 1} saved to: ${filepath}`)
  }

  console.log('\n🎉 All tests completed!')
}

// Run the test
main().catch((error) => {
  console.error('❌ Main function failed:', error)
  process.exit(1)
})

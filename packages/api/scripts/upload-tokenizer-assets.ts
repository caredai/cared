import { readdirSync, readFileSync } from 'fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PutObjectCommand } from '@aws-sdk/client-s3'

import { env } from '../src/env'
import { getClient } from '../src/routes/s3-upload/client'

// @ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get S3 client instance
const s3 = getClient()

// Define the source directory path
const TOKENIZERS_DIR = path.resolve(__dirname, '../../tokenizer/assets/tokenizers')

// Function to upload a file to S3
async function uploadFile(filePath: string, key: string) {
  try {
    const fileContent = readFileSync(filePath)
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: fileContent,
      ContentType: 'application/json', // Set the appropriate content type
    })

    await s3.send(command)
    console.log(`Successfully uploaded ${key}`)
  } catch (error) {
    console.error(`Error uploading ${key}:`, error)
    throw error
  }
}

// Main function to upload all tokenizer files
async function uploadTokenizers() {
  try {
    const files = readdirSync(TOKENIZERS_DIR)

    for (const file of files) {
      const filePath = path.resolve(TOKENIZERS_DIR, file)
      const key = `tokenizers/${file}` // Store in tokenizers/ prefix
      await uploadFile(filePath, key)
    }

    console.log('All tokenizer files uploaded successfully')
  } catch (error) {
    console.error('Error uploading tokenizer files:', error)
    process.exit(1)
  }
}

// Execute the upload
void uploadTokenizers()

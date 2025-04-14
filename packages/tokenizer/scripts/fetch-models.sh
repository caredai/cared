#!/bin/bash

set -e

MODEL_URL="./assets/tokenizers"

for model in "claude.json" "gemma.model"; do
  echo -e "\nDownloading $model..."
  curl -L "https://github.com/SillyTavern/SillyTavern/raw/refs/heads/release/src/tokenizers/$model" -o "$MODEL_URL/$model"
done

for model in "deepseek.json" "qwen2.json"; do
  echo -e "\nDownloading $model..."
  curl -L "https://github.com/SillyTavern/SillyTavern-Tokenizers/raw/refs/heads/main/$model" -o "$MODEL_URL/$model"
done

echo -e "\nTokenizer models downloaded successfully to: $MODEL_URL"

exit 0

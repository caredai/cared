'use server';

import { getSuggestionsByArtifactId } from '@/lib/db/queries';

export async function getSuggestions({ artifactId }: { artifactId: string }) {
  const suggestions = await getSuggestionsByArtifactId({ artifactId });
  return suggestions ?? [];
}

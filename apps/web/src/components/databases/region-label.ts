import type { AllowedDatabaseRegion } from '@cared/api/types'

/** Human-readable labels for Neon region IDs. */
const REGION_LABELS: Record<AllowedDatabaseRegion, string> = {
  'aws-us-east-1': 'US East (N. Virginia)',
  'aws-us-east-2': 'US East (Ohio)',
  'aws-us-west-2': 'US West (Oregon)',
  'aws-eu-central-1': 'Europe (Frankfurt)',
  'aws-eu-west-2': 'Europe (London)',
  'aws-ap-southeast-1': 'Asia Pacific (Singapore)',
  'aws-ap-southeast-2': 'Asia Pacific (Sydney)',
  'aws-sa-east-1': 'South America (São Paulo)',
}

export function formatDatabaseRegion(regionId: string) {
  return REGION_LABELS[regionId as AllowedDatabaseRegion] || regionId
}

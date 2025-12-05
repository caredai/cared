import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

// Parse command line arguments
const args = process.argv.slice(2)
const shouldCreateTokens = args.includes('--create-tokens') || args.includes('-t')

interface Location {
  id: string
  name: string
  isDefault?: boolean
}

/**
 * Parse the output of `turso db locations` command
 * Example output:
 * ID↓                 LOCATION
 * aws-ap-northeast-1  AWS AP NorthEast (Tokyo)  [default]
 * aws-ap-south-1      AWS AP South (Mumbai)
 */
function parseLocations(output: string): Location[] {
  const lines = output.trim().split('\n')
  const locations: Location[] = []

  // Skip header line (starts with "ID↓" or "ID")
  const regex = /^(\S+)\s+(.+?)(?:\s+\[default\])?$/
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue

    // Match location ID and name
    // Format: "aws-ap-northeast-1  AWS AP NorthEast (Tokyo)  [default]"
    const match = regex.exec(line)
    if (match?.[1] && match[2]) {
      const id = match[1]
      const name = match[2]
      const isDefault = line.includes('[default]')
      locations.push({ id, name: name.trim(), isDefault })
    }
  }

  return locations
}

/**
 * Check if a group exists by name
 */
async function groupExists(groupName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`turso group list`)
    // Check if the group name appears in the list
    return stdout.includes(groupName)
  } catch {
    // If command fails, assume group doesn't exist
    return false
  }
}

/**
 * Create a group for a location
 */
async function createGroup(locationId: string): Promise<void> {
  try {
    const { stderr } = await execAsync(`turso group create ${locationId} --location ${locationId}`)
    if (stderr && !stderr.includes('Created')) {
      console.error(`Error creating group ${locationId}:`, stderr)
      return
    }
    console.log(`✓ Created group: ${locationId}`)
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Check if it's because group already exists
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`⊘ Group already exists: ${locationId}`)
      } else {
        console.error(`✗ Failed to create group ${locationId}:`, error.message)
      }
    } else {
      console.error(`✗ Failed to create group ${locationId}:`, error)
    }
  }
}

/**
 * Create a token for a group
 * Returns the token string if successful, null otherwise
 */
async function createToken(groupId: string): Promise<string | null> {
  try {
    const { stdout, stderr } = await execAsync(`turso group tokens create ${groupId}`)
    // Token is usually in stdout, but check stderr for errors
    if (stderr && !stderr.includes('Created') && !stderr.includes('token')) {
      console.error(`Error creating token for group ${groupId}:`, stderr)
      return null
    }
    const token = stdout.trim()
    if (token) {
      return token
    }
    console.error(`Could not extract token from output for group ${groupId}`)
    return null
  } catch (error: unknown) {
    console.error(`✗ Failed to create token for group ${groupId}:`, error)
    return null
  }
}

/**
 * Main function to create groups for all locations
 */
async function main() {
  try {
    if (shouldCreateTokens) {
      console.log('Token creation mode enabled (--create-tokens)\n')
    }

    console.log('Fetching locations from Turso...')
    const { stdout } = await execAsync('turso db locations')
    const locations = parseLocations(stdout)

    if (locations.length === 0) {
      console.log('No locations found')
      return
    }

    console.log(`Found ${locations.length} locations:`)
    locations.forEach((loc) => {
      console.log(`  - ${loc.id}${loc.isDefault ? ' [default]' : ''}`)
    })

    console.log('\nChecking and creating groups...')
    const groupTokenMap: Record<string, string> = {}

    for (const location of locations) {
      const exists = await groupExists(location.id)
      if (exists) {
        console.log(`⊘ Group already exists: ${location.id}`)
      } else {
        await createGroup(location.id)
      }

      // Create token if requested (for both existing and newly created groups)
      if (shouldCreateTokens) {
        console.log(`Creating token for group: ${location.id}...`)
        const token = await createToken(location.id)
        if (token) {
          groupTokenMap[location.id] = token
          console.log(`✓ Token created for group: ${location.id}`)
        } else {
          console.error(`✗ Failed to create token for group: ${location.id}`)
        }
      }
    }

    if (shouldCreateTokens && Object.keys(groupTokenMap).length > 0) {
      console.log('\n' + '='.repeat(60))
      console.log('Group ID to Token Mapping:')
      console.log('='.repeat(60))
      console.log(JSON.stringify(groupTokenMap, null, 2))
      console.log('='.repeat(60))
      console.log('\n📝 Environment Variable Configuration:')
      console.log(`  TURSO_GROUP_TOKENS='${JSON.stringify(groupTokenMap)}'`)
      console.log('')
    }

    console.log('\nDone!')
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
      process.exit(1)
    } else {
      console.error('Unknown error:', error)
      process.exit(1)
    }
  }
}

void main()

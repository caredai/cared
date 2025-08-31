export const providerKeysStatesScript = `
-- Load ProviderKeyStateList from Redis key using RedisJSON
local key = KEYS[1]
local request_json = ARGV[1]

-- Parse the request object containing now, window, and changes
local request = cjson.decode(request_json)
local now = request.now
local window = request.window
local key_ttl = request.keyTtl -- Key expiration time in milliseconds
local changes = request.changes

-- Load states list and expiration time from a single object
local data = {}
local data_exists = redis.call('JSON.GET', key)
if data_exists then
  data = cjson.decode(data_exists)
end

-- Extract states and expiration time from data object
local states = data.states or {}
local key_expires_at = data.expiresAt or 0

-- Helper function to find state by ID
local function find_state_by_id(id)
  for i, state in ipairs(states) do
    if state.id == id then
      return i, state
    end
  end
  return nil, nil
end

-- Helper function to create default stats
local function create_default_stats(expired_at)
  return {
    expiredAt = expired_at,
    failures = 0,
    successes = 0,
    latencyAverage = 0,
    latencySpike = 0
  }
end

-- Helper function to calculate window boundaries
local function calculate_window_boundaries(now, window)
  local current_window_start = math.floor(now / window) * window
  local current_window_expired = current_window_start + window
  local previous_window_start = current_window_start - window
  local previous_window_expired = current_window_start
  
  return current_window_expired, previous_window_expired
end

-- Helper function to check if stats are suitable for previous window
local function is_suitable_for_previous_window(stats, target_expired_at, window)
  -- Check if the stats window completely aligns with the target previous window
  return stats.expiredAt == target_expired_at
end

-- Helper function to slide windows if needed
local function slide_windows_if_needed(state, now, window)
  local current_window_expired, previous_window_expired = calculate_window_boundaries(now, window)
  
  if now >= state.currentWindow.expiredAt then
    -- Current window has expired, need to create new windows
    local old_current_window = state.currentWindow
    
    -- Check if old current window is suitable for previous window
    if is_suitable_for_previous_window(old_current_window, previous_window_expired, window) then
      -- Move old current window to previous window
      state.previousWindow = old_current_window
    else
      -- Create new previous window
      state.previousWindow = create_default_stats(previous_window_expired)
    end
    
    -- Create new current window
    state.currentWindow = create_default_stats(current_window_expired)
    
    return true -- Windows were slid
  end
  
  return false -- Windows were not slid
end

-- Helper function to update stats
local function update_stats(stats, now, success, latency)
  if success then
    stats.successes = stats.successes + 1
    
    -- Only calculate latency for successful operations
    if stats.successes == 1 then
      stats.latencyAverage = latency
    else
      stats.latencyAverage = (stats.latencyAverage * (stats.successes - 1) + latency) / stats.successes
    end
    
    -- Update latency spike for successful operations
    if latency > stats.latencySpike then
      stats.latencySpike = latency
    end
  else
    stats.failures = stats.failures + 1
    -- Don't update latency stats for failed operations
  end
end

-- Helper function to sort states by ID (descending order for UUID strings)
local function sort_states_by_id(states)
  table.sort(states, function(a, b)
    return a.id > b.id
  end)
end

-- Check and change states
for _, state in ipairs(states) do
  -- Check if rateLimitedUntil has expired
  if state.rateLimitedUntil and now >= state.rateLimitedUntil then
    state.rateLimited = false
    state.rateLimitedUntil = 0
  end
  
  -- Check if cooldownUntil has expired
  if state.cooldownUntil and now >= state.cooldownUntil then
    state.circuitBreaker = 0 -- Reset to Closed state
    state.cooldownUntil = 0
  end
  
  -- Check if we need to slide windows
  slide_windows_if_needed(state, now, window)
end

-- Process each change
for _, change in ipairs(changes) do
  if change.type == 0 then -- Add
    -- Check if state with same ID already exists
    local existing_index, existing_state = find_state_by_id(change.id)
    if not existing_state then
      -- Calculate window boundaries for the new state
      local current_window_expired, previous_window_expired = calculate_window_boundaries(now, window)
      
      -- Create new state with proper window boundaries
      local new_state = {
        id = change.id,
        byok = change.byok,
        key = change.key,
        disabled = change.disabled or false,
        lastUsedAt: change.lastUsedAt or 0,
        rateLimited = change.rateLimited or false,
        rateLimitedUntil = change.rateLimitedUntil or 0,
        circuitBreaker = change.circuitBreaker or 0,
        cooldownUntil = change.cooldownUntil or 0,
        previousWindow = create_default_stats(previous_window_expired),
        currentWindow = create_default_stats(current_window_expired)
      }
      table.insert(states, new_state)
    end
    
  elseif change.type == 1 then -- Update
    local index, state = find_state_by_id(change.id)
    if state then
      state.lastUsedAt = now
      if change.key then
        state.key = change.key
      end
      if change.disabled ~= nil then
        state.disabled = change.disabled
      end
      if change.rateLimited ~= nil then
        state.rateLimited = change.rateLimited
      end
      if change.rateLimitedUntil ~= nil then
        state.rateLimitedUntil = change.rateLimitedUntil
      end
      if change.circuitBreaker ~= nil then
        state.circuitBreaker = change.circuitBreaker
      end
      if change.cooldownUntil ~= nil then
        state.cooldownUntil = change.cooldownUntil
      end
    end
    
  elseif change.type == 2 then -- UpdateStats
    local index, state = find_state_by_id(change.id)
    if state then
      state.lastUsedAt = now
      -- Update stats in current window
      update_stats(state.currentWindow, now, change.success, change.latency)
    end
    
  elseif change.type == 3 then -- Remove
    local index, state = find_state_by_id(change.id)
    if index then
      table.remove(states, index)
    end
  end
end

-- Sort states by ID before saving
sort_states_by_id(states)

-- Auto-renewal logic: Check if key expiration is close and extend if needed
local new_key_expires_at = key_expires_at
if key_ttl and key_ttl > 0 then
  local quarter_ttl = key_ttl / 4
  
  -- If current expiration time is close (less than a quarter of TTL away), extend it
  if (key_expires_at - now) < quarter_ttl then
    new_key_expires_at = now + key_ttl
  end
end

-- Create data object containing both states and expiration time
local data_to_save = {
  states = states,
  expiresAt = new_key_expires_at
}

-- Save updated data back to Redis using RedisJSON
redis.call('JSON.SET', key, '$', cjson.encode(data_to_save))

-- Set Redis key expiration time
if new_key_expires_at > key_expires_at then
  redis.call('PEXPIREAT', key, new_key_expires_at)
end

return cjson.encode(data_to_save)
`

export interface DeleteKeysByPrefixResult {
  cursor: string
  deleted: number
  scanned: number
}

export const deleteKeysByPrefixScript = `
-- Delete keys by prefix using Redis SCAN command for a single batch
-- This script processes one batch of keys matching a given prefix pattern
-- Usage: EVAL script 0 prefix [cursor] [batch_size]

local prefix = ARGV[1] or ""
local cursor = ARGV[2] or "0"
local batch_size = tonumber(ARGV[3]) or 1000

-- Validate input parameters
if prefix == "" then
  error("Prefix cannot be empty")
end

if batch_size <= 0 or batch_size > 10000 then
  error("Batch size must be between 1 and 10000")
end

-- SCAN command to get batch of keys
local result = redis.call("SCAN", cursor, "MATCH", prefix .. "*", "COUNT", batch_size)
local next_cursor = result[1]
local keys = result[2]

-- Delete keys in current batch using UNLINK for optimal performance
local deleted_count = 0
if #keys > 0 then
  deleted_count = redis.call("UNLINK", unpack(keys))
end

-- Return next cursor and deleted count
-- Use cjson.encode to ensure proper serialization
return cjson.encode({
  cursor = next_cursor,
  deleted = deleted_count,
  scanned = #keys
})
`

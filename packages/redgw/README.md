# @cared/redgw - Redis Graph Gateway & Offloader

`redgw` is a high-performance gateway and background service designed specifically for managing Redis Graph (FalkorDB). It provides an oRPC interface for graph database operations and integrates an intelligent "Offloader" service to optimize memory usage and costs in large-scale graph data scenarios.

This project is tailored for **Redis Cluster** environments. It addresses the challenge of ensuring data consistency in an environment that does not support cross-slot transactions by leveraging distributed locks and atomic Lua scripts.

## Core Features

- **oRPC Gateway**: Offers a type-safe oRPC API for querying, modifying, deleting, and managing graph data.
- **Graph Lifecycle Management**: Implements full lifecycle management for graphs, including creation, copying, and deletion.
- **Automatic Memory Optimization**: Includes a background "Offloader" service that automatically offloads infrequently accessed graphs from Redis memory to an object store like S3, and seamlessly restores them when needed.
- **Built for Redis Cluster**: All critical operations are carefully designed to ensure atomicity and consistency in a Redis Cluster environment.
- **State Machine Driven**: Each graph is managed by a robust state machine with explicit states (`active` or `offloaded`) to control its transitions between memory and persistent storage.

## Architecture

`redgw` consists of two main components that can be run as independent processes.

### 1. Gateway Server (`--server`)

This component provides the oRPC endpoints that handle all graph operation requests from clients.

- **Access Control**: Before executing any graph operation, it calls the `offloader.access(graphName)` method.
- **On-Demand Loading**: If a graph is currently in the `offloaded` state, the `access` method transparently handles its restoration from S3 back into Redis.
- **Access Time Updates**: Every access refreshes the graph's last access timestamp, which is used for subsequent offloading decisions.

### 2. Offloader (`--offloader`)

This is a background daemon process responsible for monitoring and managing graph data in Redis to conserve memory.

- **Idle Graph Identification**: Periodically scans a Sorted Set that tracks graph access times to find graphs that have not been accessed beyond a preset threshold (e.g., 12 hours).
- **Safe Offloading Process**:
  1.  Acquires a distributed lock for the target graph to prevent concurrent read/write operations during the offload process.
  2.  Serializes the graph data using the `DUMP` command.
  3.  Uploads the serialized data to S3.
  4.  Updates the graph's status to `offloaded`.
  5.  Deletes the graph data from Redis to free up memory.
  6.  Releases the distributed lock.

## Consistency in Redis Cluster

Since Redis Cluster does not support `MULTI/EXEC` transactions across multiple keys, we employ the following strategies to guarantee atomicity and consistency:

- **Distributed Locks**: All modification operations on a graph (like offloading, restoring, or deleting) use the `SET key value NX EX seconds` command to acquire a distributed lock. This ensures that only one process can modify a specific graph and its metadata at any given time.
- **Atomic Lua Scripts**: For "check-and-set" operations involving a single key or multiple keys in the same slot, we use Lua scripts executed via `EVALSHA` (with a fallback to `EVAL` if the script is not cached). This guarantees atomicity for actions such as:
  - Safely releasing a lock.
  - Safely extending a lock's TTL (lock renewal).
  - Checking a graph's status and updating its access time in a single atomic operation.
- **Lock Renewal**: For potentially long-running operations (e.g., uploading/downloading large files to/from S3), the system automatically renews the held lock to prevent it from expiring prematurely.

## Offloader State Machine: A Technical Deep Dive

To ensure data consistency and prevent race conditions in a distributed environment, the offloader implements a robust state machine for each graph. This section details the states, the key processes, and the technical reasoning behind the implementation.

### Core Concepts

#### Graph States

A graph can exist in one of two primary states, represented by the value of the `graph:status:{graphName}` Redis key:

1.  **`active`**: The graph data is currently loaded in Redis and is ready for immediate access. An entry for the graph exists in the `graph:access_time` sorted set.
2.  **`offloaded`**: The graph data has been moved to S3 and is not present in Redis memory. The graph does not have an entry in the `graph:access_time` sorted set.

A transient **`locked`** state also exists whenever a process acquires the `graph:lock:{graphName}` key to perform a critical operation.

#### Key Redis Objects

- `graph:{graphName}`: The actual FalkorDB graph data structure.
- `graph:status:{graphName}`: A string key holding the current state (`active` or `offloaded`).
- `graph:access_time`: A sorted set where members are graph names and scores are the last access time (in hours since epoch). This is the source of truth for identifying idle graphs.
- `graph:lock:{graphName}`: A temporary key used as a distributed lock to serialize critical operations on a per-graph basis.

---

### Process 1: Graph Access and On-Demand Restoration

This is the most critical workflow, triggered every time a client requests access to a graph via the oRPC gateway.

**Goal**: Ensure the graph is in the `active` state before an operation proceeds.

**State Transition Diagram**: `(any state)` -> `LOCKED` -> `ACTIVE`

**Steps & Technical Considerations**:

1.  **Fast Path (Atomic Check)**:
    - **Action**: An atomic Lua script (`CHECK_STATUS_AND_REFRESH_ACCESS_SCRIPT`) is executed. It gets the graph's status. If the status is `active`, it also updates the score in the `graph:access_time` sorted set.
    - **Consideration**: Using a Lua script makes this check-and-update operation atomic. This is crucial for performance, as it avoids locking for the most common scenario (accessing an active graph) while still preventing lost access-time updates.

2.  **Slow Path (Lock Acquisition)**:
    - **Action**: If the graph is not `active`, the process attempts to acquire a distributed lock using `SET graph:lock:{graphName} <random_value> NX EX <ttl>`.
    - **Consideration**: `NX` (Not Exists) ensures that only one process can acquire the lock. If locking fails, it means another process is already restoring or modifying this graph. The current process will wait and retry with exponential backoff, preventing a thundering herd problem.

3.  **Critical Section (Lock Acquired)**:
    - **Action**: **Re-check the status.** The state could have changed between the initial check and the lock being acquired.
    - **Consideration**: This re-check is the most important step for preventing race conditions. For example, another process might have already restored the graph and released the lock just before this process acquired it. Without this re-check, the process might perform redundant work.

    - **Action**: If the status is `offloaded`, the `restore()` process begins:
      1.  Download the graph dump from S3.
      2.  **Defensively delete the graph key from Redis (`DEL graph:{graphName}`).** This cleans up any potential "zombie" or orphaned graph data left from a previous failed operation.
      3.  Use the `RESTORE` command to load the data into Redis.
      4.  Set the graph status to `active`.
      5.  Add the graph to the `graph:access_time` sorted set with the current time as its score.
    - **Consideration (Lock Renewal & Idempotency)**: The S3 download and Redis `RESTORE` can be time-consuming. The entire operation is wrapped in a `withLockRenewal` utility, which periodically extends the lock's TTL, preventing it from expiring mid-operation and allowing another process to interfere. The added `DEL` command makes the `restore` operation more idempotent and robust against crashes, as it ensures a clean slate before attempting the actual `RESTORE`. If a crash occurs after data is loaded but before the status is updated, the next `access` attempt will cleanly delete the orphaned data before re-attempting the restore.

4.  **Release Lock**:
    - **Action**: A Lua script (`RELEASE_LOCK_SCRIPT`) is used to delete the lock key, but only if its value matches the random value set by this process.
    - **Consideration**: This atomic check-and-delete prevents a process from accidentally releasing a lock that was acquired by a different process after its own lock had expired.

---

### Process 2: Graph Offloading (Dumping)

This workflow is triggered by the background `offloader` process when it identifies a graph as "idle".

**Goal**: Safely move a graph from Redis to S3 and free up memory.

**State Transition Diagram**: `ACTIVE` -> `LOCKED` -> `OFFLOADED`

**Steps & Technical Considerations**:

1.  **Identify Idle Graphs**:
    - **Action**: The `offloader` queries the `graph:access_time` sorted set for all graphs with a score older than the `MAX_IDLE_HOURS` threshold.

2.  **Acquire Lock**:
    - **Action**: The process acquires the distributed lock for the target graph, same as in the access workflow. This is essential to prevent an API process from trying to read or modify the graph while it's being offloaded.

3.  **Critical Section (Lock Acquired)**:
    - **Action**: **Re-verify idle status.** The process re-checks both the `status` and the `zscore` from `graph:access_time`.
    - **Consideration**: This is the fix for the critical race condition where a graph is restored by the API and then immediately selected for offloading. By re-checking the access time _after_ acquiring the lock, the offloader can confirm the graph is still idle. If it was accessed recently, the offload operation is safely aborted.

    - **Action**: If the graph is confirmed to be active and idle:
      1.  The `DUMP` command serializes the graph data into a binary format.
      2.  The data is uploaded to S3.
      3.  The graph's status key is set to `offloaded`.
      4.  The graph data itself (`graph:{graphName}`) is deleted from Redis via `DEL`.
      5.  The graph is removed from the `graph:access_time` sorted set via `ZREM`.
    - **Consideration**: The order of operations is important. The graph data is only deleted from Redis after its state has been successfully updated to `offloaded`. This minimizes the window of inconsistency. While these final steps are not atomic (due to Redis Cluster limitations), the process is protected by the lock, and any failure would leave the graph in a recoverable (if slightly inconsistent) state that subsequent runs can clean up.

4.  **Release Lock**:
    - **Action**: The lock is released using the same atomic Lua script as before.

---

### Process 3: Graph Deletion

This is a destructive, terminal workflow triggered by an explicit API call.

**Goal**: Completely and permanently remove a graph and all its associated data from both Redis and S3.

**State Transition Diagram**: `(any state)` -> `LOCKED` -> `(non-existent)`

**Steps & Technical Considerations**:

1.  **Acquire Lock**:
    - **Action**: The process acquires the distributed lock for the graph.
    - **Consideration**: Locking is critical to prevent any other process (e.g., access or offload) from operating on the graph while it is being deleted.

2.  **Critical Section (Lock Acquired)**:
    - **Action**: The process deletes all traces of the graph from Redis:
      1.  `DEL graph:{graphName}` (the graph data)
      2.  `DEL graph:status:{graphName}` (the status key)
      3.  `ZREM graph:access_time {graphName}` (the access time entry)
    - **Consideration**: Within the lock, the order of these Redis deletions is not critical, as no other process can interfere. The goal is simply a full cleanup.

    - **Action**: The corresponding graph backup is deleted from S3.
    - **Consideration**: The S3 deletion is performed in a `try...catch` block. A failure to delete from S3 is treated as non-critical and will not fail the entire operation. The primary goal is to make the graph inaccessible via the gateway, which is achieved by removing it from Redis. This makes the system more resilient to transient network or S3 issues. An orphaned S3 object is less harmful than a failed delete operation that leaves the graph accessible.

3.  **Release Lock**:
    - **Action**: The lock is released, completing the deletion process.

## Fault Tolerance and Recovery Analysis

The system is designed to be resilient against process crashes and network errors. The combination of expiring distributed locks and idempotent operations ensures that the system can self-heal from most failure scenarios. Here is a breakdown of critical failure points and the system's recovery capabilities.

### Scenario 1: Crash during `restore` process

This is the most complex scenario. Let's assume the process crashes after acquiring the lock.

- **Crash Point**: After `client.restore` but before `setStatus('active')`.
  - **State at Crash**: The lock exists (until TTL expires). Graph data is present in Redis, but its `status` key is still `offloaded`. This is an inconsistent state, creating "zombie" data in Redis.
  - **Self-Healing Mechanism**: **Yes**. The system now automatically recovers.
    1.  The lock expires.
    2.  The next `access` call for this graph is triggered. It sees the `offloaded` status and acquires the lock to start a new `restore` process.
    3.  Crucially, the first step in the `restore` process is now `await this.client.del(graph)`. This command deletes the "zombie" data left from the previous failed attempt.
    4.  The `restore` process then continues on a clean slate, successfully restoring the graph and updating its status.
  - **Conclusion**: The defensive `DEL` command makes the `restore` process idempotent and robust, enabling automatic recovery from its most critical failure point.

### Scenario 2: Crash during `dump` (offload) process

- **Crash Point**: Before `setStatus('offloaded')`.
  - **State at Crash**: The lock will expire. The graph's status remains `active`. Data is still in Redis. An incomplete file may exist on S3.
  - **Self-Healing Mechanism**: **Yes**. The graph is still considered `active`. If it remains idle, the offloader will select it again in a future cycle. The subsequent `dump` operation will overwrite the incomplete S3 file and proceed normally.

- **Crash Point**: After `setStatus('offloaded')` but before `client.del(graph)`.
  - **State at Crash**: The lock expires. The graph `status` is `offloaded`, but the data still exists in Redis. This is the same "zombie" data inconsistency as in Scenario 1.
  - **Self-Healing Mechanism**: **Yes**, via the same mechanism as Scenario 1. The next `access` call will trigger the robust `restore` process, which will clean up the zombie data before restoring from S3.

- **Crash Point**: After `client.del(graph)` but before `client.zRem(...)`.
  - **State at Crash**: Lock expires. `status` is `offloaded`. Data is gone from Redis. However, an entry for the graph still exists in the `graph:access_time` sorted set.
  - **Self-Healing Mechanism**: **Yes**. This is a case the system handles gracefully.
    1.  The offloader will eventually select this graph again because it's in the `access_time` set.
    2.  The `dump` process will start, acquire a lock, and check the status.
    3.  It will find the status is `offloaded` and execute its specific cleanup logic for this case, which includes calling `zRem` again.
    4.  The system returns to a consistent state.

### Scenario 3: Crash during `delete` process

- **Crash Point**: During any of the Redis `DEL`/`ZREM` operations.
  - **State at Crash**: Lock expires. Some, but not all, of the graph's keys in Redis are deleted.
  - **Self-Healing Mechanism**: **Yes**. The graph is in a partially deleted, inaccessible state. A subsequent `delete` call for the same graph will simply finish cleaning up the remaining keys. An `access` call would treat it as non-existent and create a new one.

- **Crash Point**: After all Redis operations but during S3 deletion.
  - **State at Crash**: Lock expires. The graph is completely gone from Redis's perspective but an orphaned backup file remains on S3.
  - **Self-Healing Mechanism**: **Acceptable State**. The system has achieved its primary goal of making the graph inaccessible. As noted in the design, S3 deletion is non-critical. Orphaned S3 objects can be managed by separate, out-of-band cleanup scripts.

## How to Run

From the root of the monorepo:

#### Run the Gateway Server

```bash
pnpm --filter @cared/redgw start:server
```

#### Run the Offloader Service

```bash
pnpm --filter @cared/redgw start:offloader
```

## Configuration

The service is configured via environment variables, which primarily include:

- `REDIS_CLUSTER_HEADLESS_SERVICE_HOSTNAME`: The headless service address for the Redis Cluster.
- `REDIS_PASSWORD`: The password for Redis.
- `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: Configuration for S3 storage.
- `API_KEY`: The access key for the oRPC service.
- `PORT`: The port on which the gateway server listens.

import type { Embedder, LLM, MemoryConfig } from 'mem0ai/oss'
import type { Driver } from 'neo4j-driver'
import Cypher from '@neo4j/cypher-builder'
import {
  BM25,
  DELETE_MEMORY_TOOL_GRAPH,
  EmbedderFactory,
  EXTRACT_ENTITIES_TOOL,
  EXTRACT_RELATIONS_PROMPT,
  getDeleteMessages,
  LLMFactory,
  logger,
  RELATIONS_TOOL,
} from 'mem0ai/oss'
import neo4j from 'neo4j-driver'

interface SearchOutput {
  source: string
  source_id: string
  relationship: string
  relation_id: string
  destination: string
  destination_id: string
  similarity: number
}
interface Tool {
  type: string
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

interface GraphMemoryResult {
  deleted_entities: any[]
  added_entities: any[]
  relations?: any[]
}

export class MemoryGraph {
  private config: MemoryConfig
  private graph: Driver
  private embeddingModel: Embedder
  private llm: LLM
  private structuredLlm: LLM
  private llmProvider: string
  private threshold: number

  constructor(config: MemoryConfig) {
    this.config = config
    if (
      !config.graphStore?.config.url ||
      !config.graphStore.config.username ||
      !config.graphStore.config.password
    ) {
      throw new Error('Neo4j configuration is incomplete')
    }

    this.graph = neo4j.driver(
      config.graphStore.config.url,
      neo4j.auth.basic(config.graphStore.config.username, config.graphStore.config.password),
    )

    this.embeddingModel = EmbedderFactory.create(
      this.config.embedder.provider,
      this.config.embedder.config,
    )

    this.llmProvider = 'openai'
    if (this.config.llm.provider) {
      this.llmProvider = this.config.llm.provider
    }
    if (this.config.graphStore?.llm?.provider) {
      this.llmProvider = this.config.graphStore.llm.provider
    }

    this.llm = LLMFactory.create(this.llmProvider, this.config.llm.config)
    this.structuredLlm = LLMFactory.create(this.llmProvider, this.config.llm.config)
    this.threshold = 0.7
  }

  async add(data: string, filters: Record<string, any>): Promise<GraphMemoryResult> {
    const entityTypeMap = await this._retrieveNodesFromData(data, filters)

    const toBeAdded = await this._establishNodesRelationsFromData(data, filters, entityTypeMap)

    const searchOutput = await this._searchGraphDb(Object.keys(entityTypeMap), filters)

    const toBeDeleted = await this._getDeleteEntitiesFromSearchOutput(searchOutput, data, filters)

    const deletedEntities = await this._deleteEntities(toBeDeleted, filters.userId)

    const addedEntities = await this._addEntities(toBeAdded, filters.userId, entityTypeMap)

    return {
      deleted_entities: deletedEntities,
      added_entities: addedEntities,
      relations: toBeAdded,
    }
  }

  async search(query: string, filters: Record<string, any>, limit = 100) {
    const entityTypeMap = await this._retrieveNodesFromData(query, filters)
    const searchOutput = await this._searchGraphDb(Object.keys(entityTypeMap), filters, limit)

    if (!searchOutput.length) {
      return []
    }

    const searchOutputsSequence = searchOutput.map((item) => [
      item.source,
      item.relationship,
      item.destination,
    ])

    const bm25 = new BM25(searchOutputsSequence)
    const tokenizedQuery = query.split(' ')
    const rerankedResults = bm25.search(tokenizedQuery).slice(0, 5)

    const searchResults = rerankedResults.map((item) => ({
      source: item[0],
      relationship: item[1],
      destination: item[2],
    }))

    logger.info(`Returned ${searchResults.length} search results`)
    return searchResults
  }

  async deleteAll(filters: Record<string, any>) {
    const session = this.graph.session()
    try {
      const n = new Cypher.Node()
      const query = new Cypher.Match(
        new Cypher.Pattern(n, {
          properties: {
            user_id: new Cypher.Param(filters.userId),
          },
        }),
      ).detachDelete(n)

      const { cypher, params } = query.build()
      await session.run(cypher, params)
    } finally {
      await session.close()
    }
  }

  async getAll(filters: Record<string, any>, limit = 100) {
    const session = this.graph.session()
    try {
      const n = new Cypher.Node()
      const r = new Cypher.Relationship()
      const m = new Cypher.Node()

      const pattern = new Cypher.Pattern(n, {
        properties: {
          user_id: new Cypher.Param(filters.userId),
        },
      })
        .related(r)
        .to(m, {
          properties: {
            user_id: new Cypher.Param(filters.userId),
          },
        })

      const query = new Cypher.Match(pattern)
        .return(
          [n.property('name'), 'source'],
          [Cypher.type(r), 'relationship'],
          [m.property('name'), 'target'],
        )
        .limit(new Cypher.Param(Math.floor(Number(limit))))

      const { cypher, params } = query.build()
      const result = await session.run(cypher, params)

      const finalResults = result.records.map((record) => ({
        source: record.get('source'),
        relationship: record.get('relationship'),
        target: record.get('target'),
      }))

      logger.info(`Retrieved ${finalResults.length} relationships`)
      return finalResults
    } finally {
      await session.close()
    }
  }

  private async _retrieveNodesFromData(data: string, filters: Record<string, any>) {
    const tools = [EXTRACT_ENTITIES_TOOL] as Tool[]
    const searchResults = await this.structuredLlm.generateResponse(
      [
        {
          role: 'system',
          content: `You are a smart assistant who understands entities and their types in a given text. If user message contains self reference such as 'I', 'me', 'my' etc. then use ${filters.userId} as the source entity. Extract all the entities from the text. ***DO NOT*** answer the question itself if the given text is a question.`,
        },
        { role: 'user', content: data },
      ],
      { type: 'json_object' },
      tools,
    )

    let entityTypeMap: Record<string, string> = {}
    try {
      if (typeof searchResults !== 'string' && searchResults.toolCalls) {
        for (const call of searchResults.toolCalls) {
          if (call.name === 'extract_entities') {
            const args = JSON.parse(call.arguments)
            for (const item of args.entities) {
              entityTypeMap[item.entity] = item.entity_type
            }
          }
        }
      }
    } catch (e: any) {
      logger.error(`Error in search tool: ${e}`)
    }

    entityTypeMap = Object.fromEntries(
      Object.entries(entityTypeMap).map(([k, v]) => [
        k.toLowerCase().replace(/ /g, '_'),
        v.toLowerCase().replace(/ /g, '_'),
      ]),
    )

    logger.debug(`Entity type map: ${JSON.stringify(entityTypeMap)}`)
    return entityTypeMap
  }

  private async _establishNodesRelationsFromData(
    data: string,
    filters: Record<string, any>,
    entityTypeMap: Record<string, string>,
  ) {
    let messages
    if (this.config.graphStore?.customPrompt) {
      messages = [
        {
          role: 'system',
          content:
            EXTRACT_RELATIONS_PROMPT.replace('USER_ID', filters.userId).replace(
              'CUSTOM_PROMPT',
              `4. ${this.config.graphStore.customPrompt}`,
            ) + '\nPlease provide your response in JSON format.',
        },
        { role: 'user', content: data },
      ]
    } else {
      messages = [
        {
          role: 'system',
          content:
            EXTRACT_RELATIONS_PROMPT.replace('USER_ID', filters.userId) +
            '\nPlease provide your response in JSON format.',
        },
        {
          role: 'user',
          content: `List of entities: ${Object.keys(entityTypeMap).join(', ')}. \n\nText: ${data}`,
        },
      ]
    }

    const tools = [RELATIONS_TOOL] as Tool[]
    const extractedEntities = await this.structuredLlm.generateResponse(
      messages,
      { type: 'json_object' },
      tools,
    )

    let entities: any[] = []
    if (typeof extractedEntities !== 'string' && extractedEntities.toolCalls) {
      const toolCall = extractedEntities.toolCalls[0]
      if (toolCall?.arguments) {
        const args = JSON.parse(toolCall.arguments)
        entities = args.entities || []
      }
    }

    entities = this._removeSpacesFromEntities(entities)
    logger.debug(`Extracted entities: ${JSON.stringify(entities)}`)
    return entities
  }

  private async _searchGraphDb(
    nodeList: string[],
    filters: Record<string, any>,
    limit = 100,
  ): Promise<SearchOutput[]> {
    const resultRelations: SearchOutput[] = []
    const session = this.graph.session()

    try {
      for (const node of nodeList) {
        const nEmbedding = await this.embeddingModel.embed(node)

        // Create variables for the query
        const r = new Cypher.Relationship()
        const m = new Cypher.Node()
        const vectorNode = new Cypher.NamedVariable('node')
        const score = new Cypher.NamedVariable('score')

        // Create procedure for vector search
        // CALL db.idx.vector.queryNodes(label, attribute, k, query) YIELD node, score
        const baseQuery = new Cypher.Procedure('db.idx.vector.queryNodes', [
          new Cypher.Literal(''), // label - empty string means all labels
          new Cypher.Literal('embedding'), // attribute
          new Cypher.Param(Math.floor(Number(limit)) * 2), // k - get more results to filter
          new Cypher.Param(nEmbedding), // query vector
        ])
          .yield('node', 'score')
          .with(vectorNode, score)
          .where(
            Cypher.and(
              Cypher.eq(vectorNode.property('user_id'), new Cypher.Param(filters.userId)),
              Cypher.isNotNull(vectorNode.property('embedding')),
              Cypher.gte(score, new Cypher.Param(this.threshold)),
            ),
          )

        // First query: n-[r]->m (outgoing relationships)
        const query1 = baseQuery
          .match(
            new Cypher.Pattern(vectorNode).related(r).to(m, {
              properties: {
                user_id: new Cypher.Param(filters.userId),
              },
            }),
          )
          .return(
            [vectorNode.property('name'), 'source'],
            [Cypher.id(vectorNode), 'source_id'],
            [Cypher.type(r), 'relationship'],
            [Cypher.id(r), 'relation_id'],
            [m.property('name'), 'destination'],
            [Cypher.id(m), 'destination_id'],
            [score, 'similarity'],
          )

        // Second query: m-[r]->n (incoming relationships)
        const query2 = baseQuery
          .match(
            new Cypher.Pattern(m, {
              properties: {
                user_id: new Cypher.Param(filters.userId),
              },
            })
              .related(r)
              .to(vectorNode),
          )
          .return(
            [m.property('name'), 'source'],
            [Cypher.id(m), 'source_id'],
            [Cypher.type(r), 'relationship'],
            [Cypher.id(r), 'relation_id'],
            [vectorNode.property('name'), 'destination'],
            [Cypher.id(vectorNode), 'destination_id'],
            [score, 'similarity'],
          )

        // Combine queries with UNION
        const unionQuery = new Cypher.Union(query1, query2)

        const similarityVar = new Cypher.NamedVariable('similarity')
        const finalQuery = new Cypher.Call(unionQuery)
          .orderBy([similarityVar, 'DESC'])
          .limit(new Cypher.Param(Math.floor(Number(limit))))

        const { cypher, params } = finalQuery.build()
        const result = await session.run(cypher, params)

        resultRelations.push(
          ...result.records.map((record) => ({
            source: record.get('source'),
            source_id: record.get('source_id').toString(),
            relationship: record.get('relationship'),
            relation_id: record.get('relation_id').toString(),
            destination: record.get('destination'),
            destination_id: record.get('destination_id').toString(),
            similarity: record.get('similarity'),
          })),
        )
      }
    } finally {
      await session.close()
    }

    return resultRelations
  }

  private async _getDeleteEntitiesFromSearchOutput(
    searchOutput: SearchOutput[],
    data: string,
    filters: Record<string, any>,
  ) {
    const searchOutputString = searchOutput
      .map((item) => `${item.source} -- ${item.relationship} -- ${item.destination}`)
      .join('\n')

    const [systemPrompt, userPrompt] = getDeleteMessages(searchOutputString, data, filters.userId)

    const tools = [DELETE_MEMORY_TOOL_GRAPH] as Tool[]
    const memoryUpdates = await this.structuredLlm.generateResponse(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { type: 'json_object' },
      tools,
    )

    const toBeDeleted: any[] = []
    if (typeof memoryUpdates !== 'string' && memoryUpdates.toolCalls) {
      for (const item of memoryUpdates.toolCalls) {
        if (item.name === 'delete_graph_memory') {
          toBeDeleted.push(JSON.parse(item.arguments))
        }
      }
    }

    const cleanedToBeDeleted = this._removeSpacesFromEntities(toBeDeleted)
    logger.debug(`Deleted relationships: ${JSON.stringify(cleanedToBeDeleted)}`)
    return cleanedToBeDeleted
  }

  private async _deleteEntities(toBeDeleted: any[], userId: string) {
    const results: any[] = []
    const session = this.graph.session()

    try {
      for (const item of toBeDeleted) {
        const { source, destination, relationship } = item

        const n = new Cypher.Node()
        const r = new Cypher.Relationship()
        const m = new Cypher.Node()

        const query = new Cypher.Match(
          new Cypher.Pattern(n, {
            properties: {
              name: new Cypher.Param(source),
              user_id: new Cypher.Param(userId),
            },
          })
            .related(r, { type: relationship })
            .to(m, {
              properties: {
                name: new Cypher.Param(destination),
                user_id: new Cypher.Param(userId),
              },
            }),
        )
          .delete(r)
          .return(
            [n.property('name'), 'source'],
            [m.property('name'), 'target'],
            [Cypher.type(r), 'relationship'],
          )

        const { cypher, params } = query.build()
        const result = await session.run(cypher, params)

        results.push(result.records)
      }
    } finally {
      await session.close()
    }

    return results
  }

  private async _addEntities(
    toBeAdded: any[],
    userId: string,
    entityTypeMap: Record<string, string>,
  ) {
    const results: any[] = []
    const session = this.graph.session()

    try {
      for (const item of toBeAdded) {
        const { source, destination, relationship } = item
        const sourceType = entityTypeMap[source] || 'unknown'
        const destinationType = entityTypeMap[destination] || 'unknown'

        const sourceEmbedding = await this.embeddingModel.embed(source)
        const destEmbedding = await this.embeddingModel.embed(destination)

        const sourceNodeSearchResult = await this._searchSourceNode(sourceEmbedding, userId)
        const destinationNodeSearchResult = await this._searchDestinationNode(destEmbedding, userId)

        let query: Cypher.Clause

        if (destinationNodeSearchResult.length === 0 && sourceNodeSearchResult.length > 0) {
          // Case 1: Match existing source, merge destination and relationship
          const sourceNode = new Cypher.Node()
          const destinationNode = new Cypher.Node()
          const rel = new Cypher.Relationship()

          query = new Cypher.Match(new Cypher.Pattern(sourceNode))
            .where(
              Cypher.eq(Cypher.id(sourceNode), new Cypher.Param(sourceNodeSearchResult[0]!.id)),
            )
            .merge(
              new Cypher.Pattern(destinationNode, {
                labels: [destinationType],
                properties: {
                  name: new Cypher.Param(destination),
                  user_id: new Cypher.Param(userId),
                },
              }),
            )
            .onCreateSet(
              [destinationNode.property('created'), Cypher.timestamp()],
              [destinationNode.property('embedding'), new Cypher.Param(destEmbedding)],
            )
            .merge(
              new Cypher.Pattern(sourceNode)
                .related(rel, { type: relationship })
                .to(destinationNode),
            )
            .onCreateSet([
              rel.property('created'),
              Cypher.timestamp(),
            ])
            .return(
              [sourceNode.property('name'), 'source'],
              [Cypher.type(rel), 'relationship'],
              [destinationNode.property('name'), 'target'],
            )
        } else if (destinationNodeSearchResult.length > 0 && sourceNodeSearchResult.length === 0) {
          // Case 2: Match existing destination, merge source and relationship
          const sourceNode = new Cypher.Node()
          const destinationNode = new Cypher.Node()
          const rel = new Cypher.Relationship()

          query = new Cypher.Match(new Cypher.Pattern(destinationNode))
            .where(
              Cypher.eq(
                Cypher.id(destinationNode),
                new Cypher.Param(destinationNodeSearchResult[0]!.id),
              ),
            )
            .merge(
              new Cypher.Pattern(sourceNode, {
                labels: [sourceType],
                properties: {
                  name: new Cypher.Param(source),
                  user_id: new Cypher.Param(userId),
                },
              }),
            )
            .onCreateSet(
              [sourceNode.property('created'), Cypher.timestamp()],
              [sourceNode.property('embedding'), new Cypher.Param(sourceEmbedding)],
            )
            .merge(
              new Cypher.Pattern(sourceNode)
                .related(rel, { type: relationship })
                .to(destinationNode),
            )
            .onCreateSet([
              rel.property('created'),
              Cypher.timestamp(),
            ])
            .return(
              [sourceNode.property('name'), 'source'],
              [Cypher.type(rel), 'relationship'],
              [destinationNode.property('name'), 'target'],
            )
        } else if (sourceNodeSearchResult.length > 0 && destinationNodeSearchResult.length > 0) {
          // Case 3: Match both existing nodes, merge relationship
          const sourceNode = new Cypher.Node()
          const destinationNode = new Cypher.Node()
          const rel = new Cypher.Relationship()

          query = new Cypher.Match(new Cypher.Pattern(sourceNode))
            .where(
              Cypher.eq(Cypher.id(sourceNode), new Cypher.Param(sourceNodeSearchResult[0]!.id)),
            )
            .match(new Cypher.Pattern(destinationNode))
            .where(
              Cypher.eq(
                Cypher.id(destinationNode),
                new Cypher.Param(destinationNodeSearchResult[0]!.id),
              ),
            )
            .merge(
              new Cypher.Pattern(sourceNode)
                .related(rel, { type: relationship })
                .to(destinationNode),
            )
            .onCreateSet(
              [rel.property('created_at'), Cypher.timestamp()],
              [rel.property('updated_at'), Cypher.timestamp()],
            )
            .return(
              [sourceNode.property('name'), 'source'],
              [Cypher.type(rel), 'relationship'],
              [destinationNode.property('name'), 'target'],
            )
        } else {
          // Case 4: Merge both nodes and relationship
          const sourceNode = new Cypher.Node()
          const destinationNode = new Cypher.Node()
          const rel = new Cypher.Relationship()

          query = new Cypher.Merge(
            new Cypher.Pattern(sourceNode, {
              labels: [sourceType],
              properties: {
                name: new Cypher.Param(source),
                user_id: new Cypher.Param(userId),
              },
            }),
          )
            .onCreateSet(
              [sourceNode.property('created'), Cypher.timestamp()],
              [sourceNode.property('embedding'), new Cypher.Param(sourceEmbedding)],
            )
            .onMatchSet([
              sourceNode.property('embedding'),
              new Cypher.Param(sourceEmbedding),
            ])
            .merge(
              new Cypher.Pattern(destinationNode, {
                labels: [destinationType],
                properties: {
                  name: new Cypher.Param(destination),
                  user_id: new Cypher.Param(userId),
                },
              }),
            )
            .onCreateSet(
              [destinationNode.property('created'), Cypher.timestamp()],
              [destinationNode.property('embedding'), new Cypher.Param(destEmbedding)],
            )
            .onMatchSet([
              destinationNode.property('embedding'),
              new Cypher.Param(destEmbedding),
            ])
            .merge(
              new Cypher.Pattern(sourceNode)
                .related(rel, { type: relationship })
                .to(destinationNode),
            )
            .onCreateSet([
              rel.property('created'),
              Cypher.timestamp(),
            ])
            .return(
              [sourceNode.property('name'), 'source'],
              [Cypher.type(rel), 'relationship'],
              [destinationNode.property('name'), 'target'],
            )
        }

        const { cypher, params } = query.build()
        const result = await session.run(cypher, params)
        results.push(result.records)
      }
    } finally {
      await session.close()
    }

    return results
  }

  private _removeSpacesFromEntities(entityList: any[]) {
    return entityList.map((item) => ({
      ...item,
      source: item.source.toLowerCase().replace(/ /g, '_'),
      relationship: item.relationship.toLowerCase().replace(/ /g, '_'),
      destination: item.destination.toLowerCase().replace(/ /g, '_'),
    }))
  }

  private async _searchSourceNode(sourceEmbedding: number[], userId: string) {
    const session = this.graph.session()
    try {
      // Create variables for the query
      const vectorNode = new Cypher.NamedVariable('node')
      const score = new Cypher.NamedVariable('score')

      // Create procedure for vector search
      // CALL db.idx.vector.queryNodes(label, attribute, k, query) YIELD node, score
      const query = new Cypher.Procedure('db.idx.vector.queryNodes', [
        new Cypher.Literal(''), // label - empty string means all labels
        new Cypher.Literal('embedding'), // attribute
        new Cypher.Param(1), // k - get top 1 result
        new Cypher.Param(sourceEmbedding), // query vector
      ])
        .yield('node', 'score')
        .with(vectorNode, score)
        .where(
          Cypher.and(
            Cypher.eq(vectorNode.property('user_id'), new Cypher.Param(userId)),
            Cypher.isNotNull(vectorNode.property('embedding')),
            Cypher.gte(score, new Cypher.Param(this.threshold)),
          ),
        )
        .orderBy([score, 'DESC'])
        .limit(new Cypher.Param(1))
        .return([Cypher.id(vectorNode), 'id'])

      const { cypher, params } = query.build()
      const result = await session.run(cypher, params)

      return result.records.map((record) => ({
        id: record.get('id').toString(),
      }))
    } finally {
      await session.close()
    }
  }

  private async _searchDestinationNode(destinationEmbedding: number[], userId: string) {
    const session = this.graph.session()
    try {
      // Create variables for the query
      const vectorNode = new Cypher.NamedVariable('node')
      const score = new Cypher.NamedVariable('score')

      // Create procedure for vector search
      // CALL db.idx.vector.queryNodes(label, attribute, k, query) YIELD node, score
      const query = new Cypher.Procedure('db.idx.vector.queryNodes', [
        new Cypher.Literal(''), // label - empty string means all labels
        new Cypher.Literal('embedding'), // attribute
        new Cypher.Param(1), // k - get top 1 result
        new Cypher.Param(destinationEmbedding), // query vector
      ])
        .yield('node', 'score')
        .with(vectorNode, score)
        .where(
          Cypher.and(
            Cypher.eq(vectorNode.property('user_id'), new Cypher.Param(userId)),
            Cypher.isNotNull(vectorNode.property('embedding')),
            Cypher.gte(score, new Cypher.Param(this.threshold)),
          ),
        )
        .orderBy([score, 'DESC'])
        .limit(new Cypher.Param(1))
        .return([Cypher.id(vectorNode), 'id'])

      const { cypher, params } = query.build()
      const result = await session.run(cypher, params)

      return result.records.map((record) => ({
        id: record.get('id').toString(),
      }))
    } finally {
      await session.close()
    }
  }
}

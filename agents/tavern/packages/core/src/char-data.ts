/**
 * World Info Entry extension information interface
 */
export interface V2DataWorldInfoEntryExtensionInfos {
    /** The order in which the extension is applied relative to other extensions */
    position: number;
    /** Prevents the extension from being applied recursively */
    exclude_recursion: boolean;
    /** The chance (between 0 and 1) of the extension being applied */
    probability: number;
    /** Determines if the `probability` property is used */
    useProbability: boolean;
    /** The maximum level of nesting allowed for recursive application of the extension */
    depth: number;
    /** Defines the logic used to determine if the extension is applied selectively */
    selectiveLogic: number;
    /** A category or grouping for the extension */
    group: string;
    /** Overrides any existing group assignment for the extension */
    group_override: boolean;
    /** A value used for prioritizing extensions within the same group */
    group_weight: number;
    /** Completely disallows recursive application of the extension */
    prevent_recursion: boolean;
    /** Will only be checked during recursion */
    delay_until_recursion: boolean;
    /** The maximum depth to search for matches when applying the extension */
    scan_depth: number;
    /** Specifies if only entire words should be matched during extension application */
    match_whole_words: boolean;
    /** Indicates if group weight is considered when selecting extensions */
    use_group_scoring: boolean;
    /** Controls whether case sensitivity is applied during matching for the extension */
    case_sensitive: boolean;
    /** An identifier used for automation purposes related to the extension */
    automation_id: string;
    /** The specific function or purpose of the extension */
    role: number;
    /** Indicates if the extension is optimized for vectorized processing */
    vectorized: boolean;
    /** The order in which the extension should be displayed for user interfaces */
    display_index: number;
}

/**
 * World Info Entry interface
 */
export interface V2DataWorldInfoEntry {
    /** An array of primary keys associated with the entry */
    keys: string[];
    /** An array of secondary keys associated with the entry (optional) */
    secondary_keys?: string[];
    /** A human-readable description or explanation for the entry */
    comment: string;
    /** The main content or data associated with the entry */
    content: string;
    /** Indicates if the entry's content is fixed and unchangeable */
    constant: boolean;
    /** Indicates if the entry's inclusion is controlled by specific conditions */
    selective: boolean;
    /** Defines the order in which the entry is inserted during processing */
    insertion_order: number;
    /** Controls whether the entry is currently active and used */
    enabled: boolean;
    /** Specifies the location or context where the entry applies */
    position: string;
    /** An object containing additional details for extensions associated with the entry */
    extensions: V2DataWorldInfoEntryExtensionInfos;
    /** A unique identifier assigned to the entry */
    id: number;
}

/**
 * World Info Book interface
 */
export interface V2WorldInfoBook {
    /** The name of the book */
    name: string;
    /** The entries of the book */
    entries: V2DataWorldInfoEntry[];
}

/**
 * Regex Script Data interface
 */
export interface RegexScriptData {
    /** UUID of the script */
    id: string;
    /** The name of the script */
    scriptName: string;
    /** The regex to find */
    findRegex: string;
    /** The string to replace */
    replaceString: string;
    /** The strings to trim */
    trimStrings: string[];
    /** The placement of the script */
    placement: number[];
    /** Whether the script is disabled */
    disabled: boolean;
    /** Whether the script only applies to Markdown */
    markdownOnly: boolean;
    /** Whether the script only applies to prompts */
    promptOnly: boolean;
    /** Whether the script runs on edit */
    runOnEdit: boolean;
    /** Whether the regex should be substituted */
    substituteRegex: number;
    /** The minimum depth */
    minDepth: number;
    /** The maximum depth */
    maxDepth: number;
}

/**
 * Character Data Extension interface
 */
export interface V2CharDataExtensionInfos {
    /** A numerical value indicating the character's propensity to talk */
    talkativeness: number;
    /** A flag indicating whether the character is a favorite */
    fav: boolean;
    /** The fictional world or setting where the character exists (if applicable) */
    world: string;
    /** Prompts used to explore the character's depth and complexity */
    depth_prompt: {
        /** The level of detail or nuance targeted by the prompt */
        depth: number;
        /** The actual prompt text used for deeper character interaction */
        prompt: string;
        /** The role the character takes on during the prompted interaction */
        role: 'system' | 'user' | 'assistant';
    };
    /** Custom regex scripts for the character */
    regex_scripts: RegexScriptData[];
    // Non-standard extensions
    /** The unique identifier assigned to the character by the Pygmalion.chat */
    pygmalion_id?: string;
    /** The gitHub repository associated with the character */
    github_repo?: string;
    /** The source URL associated with the character */
    source_url?: string;
    /** The Chub-specific data associated with the character */
    chub?: {
        full_path: string;
    };
    /** The RisuAI-specific data associated with the character */
    risuai?: {
        source: string[];
    };
    /** SD-specific data associated with the character */
    sd_character_prompt?: {
        positive: string;
        negative: string;
    };
}

/**
 * V2 Character Data interface
 */
export interface V2CharData {
    /** The character's name */
    name: string;
    /** A brief description of the character */
    description: string;
    /** The character's data version */
    character_version: string;
    /** A short summary of the character's personality traits */
    personality: string;
    /** A description of the character's background or setting */
    scenario: string;
    /** The character's opening message in a conversation */
    first_mes: string;
    /** An example message demonstrating the character's conversation style */
    mes_example: string;
    /** Internal notes or comments left by the character's creator */
    creator_notes: string;
    /** A list of keywords or labels associated with the character */
    tags: string[];
    /** The system prompt used to interact with the character */
    system_prompt: string;
    /** Instructions for handling the character's conversation history */
    post_history_instructions: string;
    /** The name of the person who created the character */
    creator: string;
    /** Additional greeting messages the character can use */
    alternate_greetings: string[];
    /** Data about the character's world or story (if applicable) */
    character_book?: V2WorldInfoBook;
    /** Additional details specific to the character */
    extensions: V2CharDataExtensionInfos;
}

/**
 * V1 Character Data interface
 */
export interface V1CharData {
    /** The name of the character */
    name: string;
    /** The description of the character */
    description: string;
    /** A short personality description of the character */
    personality: string;
    /** A scenario description of the character */
    scenario: string;
    /** The first message in the conversation */
    first_mes: string;
    /** The example message in the conversation */
    mes_example: string;
    /** Creator's notes of the character */
    creatorcomment: string;
    /** The tags of the character */
    tags: string[];
    /** Talkativeness */
    talkativeness: number;
    /** Favorite status */
    fav: boolean | string;
    /** Creation date */
    create_date: string;
    /** V2 data extension */
    data: V2CharData;
    // Non-standard extensions
    /** Name of the current chat file chat */
    chat?: string;
    /** File name of the avatar image (acts as a unique identifier) */
    avatar?: string;
    /** The full raw JSON data of the character */
    json_data?: string;
}


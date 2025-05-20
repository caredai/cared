const START_TAG = '<START>'

export function parseDialogueExamples(examplesStr?: string): string[] {
  if (!examplesStr || examplesStr === START_TAG) {
    return []
  }

  if (!examplesStr.startsWith(START_TAG)) {
    examplesStr = START_TAG + '\n' + examplesStr.trim()
  }

  const blockHeading = START_TAG + '\n'

  const splitExamples = examplesStr
    .split(/<START>/gi)
    .slice(1)
    .filter((block) => block.trim().length > 0)
    .map((block) => `${blockHeading}${block.trim()}\n`)

  return splitExamples
}

export function parseDialogueExamplesAsMessages(
  mesExamplesArray: string[],
  userName: string,
  characterNameOrGroupMemberNames: string | string[],
): {
  role: string
  content: string
  name: string
}[][] {
  // get a nice array of all blocks of all example messages = array of arrays (important!)
  const examples = []
  for (const item of mesExamplesArray) {
    // replace <START> with {Example Dialogue:} and replace \r\n with just \n
    const replaced = item.replace(/<START>/i, '{Example Dialogue:}').replace(/\r/gm, '')
    const parsed = parseDialogueExampleIntoIndividual(
      replaced,
      userName,
      characterNameOrGroupMemberNames,
      true,
    )
    // add to the example message blocks array
    examples.push(parsed)
  }
  return examples
}

function parseDialogueExampleIntoIndividual(
  messageExampleString: string,
  userName: string,
  characterNameOrGroupMemberNames: string | string[],
  appendNamesForGroup = true,
): {
  role: string
  content: string
  name: string
}[] {
  const characterName =
    typeof characterNameOrGroupMemberNames === 'string'
      ? characterNameOrGroupMemberNames
      : 'Assistant'
  const groupMemberNames = Array.isArray(characterNameOrGroupMemberNames)
    ? characterNameOrGroupMemberNames
    : []

  const groupBotNames = groupMemberNames.map((name) => `${name}:`)

  const result: { role: string; content: string; name: string }[] = [] // array of msgs
  const tmp = messageExampleString.split('\n')
  let cur_msg_lines: string[] = []
  let in_user = false
  let in_bot = false
  let botName = characterName

  // DRY my cock and balls :)
  function add_msg(name: string, role: string, system_name: string) {
    // join different newlines (we split them by \n and join by \n),
    // remove char name,
    // trim to remove extra spaces
    let parsed_msg = cur_msg_lines
      .join('\n')
      .replace(name + ':', '')
      .trim()

    if (
      appendNamesForGroup &&
      groupBotNames.length &&
      ['example_user', 'example_assistant'].includes(system_name)
    ) {
      parsed_msg = `${name}: ${parsed_msg}`
    }

    result.push({ role: role, content: parsed_msg, name: system_name })
    cur_msg_lines = []
  }

  // skip the first line as it'll always be "This is how {bot name} should talk"
  for (let i = 1; i < tmp.length; i++) {
    const cur_str = tmp[i]!
    // if it's the user message, switch into user mode
    if (cur_str.startsWith(userName + ':')) {
      in_user = true
      // if we were in the bot mode previously, add the message
      if (in_bot) {
        add_msg(botName, 'system', 'example_assistant')
        in_bot = false
      }
    } else if (
      cur_str.startsWith(characterName + ':') ||
      groupBotNames.some((n) => cur_str.startsWith(n))
    ) {
      if (!cur_str.startsWith(characterName + ':')) {
        botName = cur_str.split(':')[0]!
      }

      in_bot = true
      // if we were in the user mode previously, add the message
      if (in_user) {
        add_msg(userName, 'system', 'example_user')
        in_user = false
      }
    }
    // push the current line into the current message array only after checking for the presence of user/bot
    cur_msg_lines.push(cur_str)
  }
  // Special case for last message in a block because we don't have a new message to trigger the switch
  if (in_user) {
    add_msg(userName, 'system', 'example_user')
  } else if (in_bot) {
    add_msg(botName, 'system', 'example_assistant')
  }
  return result
}

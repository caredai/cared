import type { ReducedCharacter } from '../types'

export function getCharFirstMessages(character: ReducedCharacter): string[] {
  return [
    character.content.data.first_mes,
    ...character.content.data.alternate_greetings,
  ].filter(Boolean)
}

export function randomPickCharFirstMessage(character: ReducedCharacter) {
  const arr = [
    character.content.data.first_mes,
    ...character.content.data.alternate_greetings,
  ]
  const randomIndex = Math.floor(Math.random() * arr.length)
  return arr[randomIndex]!
}

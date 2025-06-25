/**
 * Extracts words from a string.
 * @example
 * extractAllWords('Hello, world!'); // ['hello', 'world']
 */
export function extractAllWords(value: string) {
  const words: string[] = []

  if (!value) {
    return words
  }

  const matches = value.matchAll(/\b\w+\b/gim)
  for (const match of matches) {
    words.push(match[0].toLowerCase())
  }
  return words
}

/**
 * Rearranges an array in a random order.
 * @param {any[]} array The array to shuffle.
 * @returns {any[]} The shuffled array.
 * @example
 * shuffle([1, 2, 3]); // [2, 3, 1]
 */
export function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

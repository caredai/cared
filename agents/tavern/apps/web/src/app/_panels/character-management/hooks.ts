import { atom, useAtom } from 'jotai'

const isCreateCharacterAtom = atom(false)

export function useIsCreateCharacter() {
  const [isCreateCharacter] = useAtom(isCreateCharacterAtom)
  return isCreateCharacter
}

export function useSetIsCreateCharacter() {
  const [, setIsCreateCharacter] = useAtom(isCreateCharacterAtom)

  return setIsCreateCharacter
}

const showCharacterListAtom = atom(true)

export function useShowCharacterList() {
  const [showCharacterList] = useAtom(showCharacterListAtom)
  return showCharacterList
}

export function useSetShowCharacterList() {
  const [, setShowCharacterList] = useAtom(showCharacterListAtom)

  return setShowCharacterList
}

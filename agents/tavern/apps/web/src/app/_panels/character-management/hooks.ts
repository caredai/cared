import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'

const isCreateCharacterAtom = atom(false)
const isCreateCharacterGroupAtom = atom(false)
const showCharacterListAtom = atom(true)

export function useIsCreateCharacter() {
  const [isCreateCharacter] = useAtom(isCreateCharacterAtom)
  return isCreateCharacter
}

export function useIsCreateCharacterGroup() {
  const [isCreateCharacterGroup] = useAtom(isCreateCharacterGroupAtom)
  return isCreateCharacterGroup
}

export function useIsCreateCharacterOrGroup() {
  const isCreateCharacter = useIsCreateCharacter()
  const isCreateCharacterGroup = useIsCreateCharacterGroup()
  return isCreateCharacter || isCreateCharacterGroup
}

export function useShowCharacterList() {
  const [showCharacterList] = useAtom(showCharacterListAtom)
  return showCharacterList
}

export function useSetIsCreateCharacter() {
  const [isCreateCharacter, setIsCreateCharacter] = useAtom(isCreateCharacterAtom)
  const [, setIsCreateCharacterGroup] = useAtom(isCreateCharacterGroupAtom)
  const [, setShowCharacterList] = useAtom(showCharacterListAtom)

  useEffect(() => {
    if (isCreateCharacter) {
      setIsCreateCharacterGroup(false)
      setShowCharacterList(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateCharacter])

  return setIsCreateCharacter
}

export function useSetIsCreateCharacterGroup() {
  const [isCreateCharacterGroup, setIsCreateCharacterGroup] = useAtom(isCreateCharacterGroupAtom)
  const [, setIsCreateCharacter] = useAtom(isCreateCharacterAtom)
  const [, setShowCharacterList] = useAtom(showCharacterListAtom)

  useEffect(() => {
    if (isCreateCharacterGroup) {
      setIsCreateCharacter(false)
      setShowCharacterList(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateCharacterGroup])

  return setIsCreateCharacterGroup
}

export function useSetShowCharacterList() {
  const [showCharacterList, setShowCharacterList] = useAtom(showCharacterListAtom)
  const [, setIsCreateCharacter] = useAtom(isCreateCharacterAtom)
  const [, setIsCreateCharacterGroup] = useAtom(isCreateCharacterGroupAtom)

  useEffect(() => {
    if (showCharacterList) {
      setIsCreateCharacter(false)
      setIsCreateCharacterGroup(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCharacterList])

  return setShowCharacterList
}

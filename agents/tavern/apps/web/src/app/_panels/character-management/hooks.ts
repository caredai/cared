import { useCallback } from 'react'
import { atom, useAtom } from 'jotai'

const isCreateCharacterAtom = atom(false)
const isCreateCharacterGroupAtom = atom(false)
const showCharacterListAtom = atom(true)
const showChatListAtom = atom(false)

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

export function useShowChatList() {
  const [showChatList] = useAtom(showChatListAtom)
  return showChatList
}

function useSetFlag() {
  const [, setIsCreateCharacter] = useAtom(isCreateCharacterAtom)
  const [, setIsCreateCharacterGroup] = useAtom(isCreateCharacterGroupAtom)
  const [, setShowCharacterList] = useAtom(showCharacterListAtom)
  const [, setShowChatList] = useAtom(showChatListAtom)
  return useCallback(
    (
      flag?:
        | 'create-character'
        | 'create-character-group'
        | 'show-character-list'
        | 'show-chat-list',
    ) => {
      setIsCreateCharacter(flag === 'create-character')
      setIsCreateCharacterGroup(flag === 'create-character-group')
      setShowCharacterList(flag === 'show-character-list')
      setShowChatList(flag === 'show-chat-list')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useSetIsCreateCharacter() {
  const setFlag = useSetFlag()
  return useCallback(() => {
    setFlag('create-character')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useSetIsCreateCharacterGroup() {
  const setFlag = useSetFlag()
  return useCallback(() => {
    setFlag('create-character-group')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useSetShowCharacterList() {
  const setFlag = useSetFlag()
  return useCallback(() => {
    setFlag('show-character-list')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useSetShowChatList() {
  const setFlag = useSetFlag()
  return useCallback((isShow?: boolean) => {
    setFlag(isShow || isShow === undefined ? 'show-chat-list' : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useClearAllFlags() {
  const setFlag = useSetFlag()
  return useCallback(() => {
    setFlag()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

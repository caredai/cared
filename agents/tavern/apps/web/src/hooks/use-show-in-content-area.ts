import type { RefObject } from 'react'
import { useCallback } from 'react'
import { atom, useAtom } from 'jotai'

const contentAreaRefAtom = atom<RefObject<HTMLDivElement | null>>()

export function useContentAreaRef() {
  const [contentAreaRef, setContentAreaRef] = useAtom(contentAreaRefAtom)
  return { contentAreaRef, setContentAreaRef }
}

const isShowPromptInspectAtom = atom(false)
const isShowPromptEditAtom = atom(false)
const isShowCharacterAdvancedViewAtom = atom(false)

export function useIsShowPromptInspect() {
  const [isShowPromptInspect, _setIsShowPromptInspect] = useAtom(isShowPromptInspectAtom)
  const [, _setIsShowPromptEdit] = useAtom(isShowPromptEditAtom)
  const [, _setIsShowCharacterAdvancedView] = useAtom(isShowCharacterAdvancedViewAtom)

  const setIsShowPromptInspect = useCallback((show: boolean) => {
    _setIsShowPromptInspect(show)
    if (show) {
      _setIsShowPromptEdit(false)
      _setIsShowCharacterAdvancedView(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleIsShowPromptInspect = useCallback(() => {
    _setIsShowPromptInspect((prev) => !prev)
    _setIsShowPromptEdit(false)
    _setIsShowCharacterAdvancedView(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isShowPromptInspect,
    setIsShowPromptInspect,
    toggleIsShowPromptInspect,
  }
}

export function useIsShowPromptEdit() {
  const [, _setIsShowPromptInspect] = useAtom(isShowPromptInspectAtom)
  const [isShowPromptEdit, _setIsShowPromptEdit] = useAtom(isShowPromptEditAtom)
  const [, _setIsShowCharacterAdvancedView] = useAtom(isShowCharacterAdvancedViewAtom)

  const setIsShowPromptEdit = useCallback((show: boolean) => {
    _setIsShowPromptEdit(show)
    if (show) {
      _setIsShowPromptInspect(false)
      _setIsShowCharacterAdvancedView(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleIsShowPromptEdit = useCallback(() => {
    _setIsShowPromptEdit((prev) => !prev)
    _setIsShowPromptInspect(false)
    _setIsShowCharacterAdvancedView(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isShowPromptEdit,
    setIsShowPromptEdit,
    toggleIsShowPromptEdit,
  }
}

export function useIsShowCharacterAdvancedView() {
  const [isShowCharacterAdvancedView, _setIsShowCharacterAdvancedView] = useAtom(
    isShowCharacterAdvancedViewAtom,
  )
  const [, _setIsShowPromptInspect] = useAtom(isShowPromptInspectAtom)
  const [, _setIsShowPromptEdit] = useAtom(isShowPromptEditAtom)

  const setIsShowCharacterAdvancedView = useCallback((show: boolean) => {
    _setIsShowCharacterAdvancedView(show)
    if (show) {
      _setIsShowPromptInspect(false)
      _setIsShowPromptEdit(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleIsShowCharacterAdvancedView = useCallback(() => {
    _setIsShowCharacterAdvancedView((prev) => !prev)
    _setIsShowPromptInspect(false)
    _setIsShowPromptEdit(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isShowCharacterAdvancedView,
    setIsShowCharacterAdvancedView,
    toggleIsShowCharacterAdvancedView,
  }
}

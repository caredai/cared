'use client'
import Drawer from '@/base/drawer'
import type { IDrawerProps } from '@/base/drawer'

type IFloatRightContainerProps = {
  isMobile: boolean
  children?: React.ReactNode
} & IDrawerProps

const FloatRightContainer = ({ isMobile, children, isOpen, ...drawerProps }: IFloatRightContainerProps) => {
  return (
    <>
      {isMobile && (
        <Drawer isOpen={isOpen} {...drawerProps}>{children}</Drawer>
      )}
      {(!isMobile && isOpen) && (
        <>{children}</>
      )}
    </>
  )
}

export default FloatRightContainer

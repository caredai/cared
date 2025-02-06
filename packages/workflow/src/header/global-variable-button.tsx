import { memo } from 'react'
import Button from '@/base/button'
import { GlobalVariable } from '@/base/icons/src/vender/line/others'
import { useStore } from '@/store'

const GlobalVariableButton = ({ disabled }: { disabled: boolean }) => {
  const setShowPanel = useStore(s => s.setShowGlobalVariablePanel)

  const handleClick = () => {
    setShowPanel(true)
  }

  return (
    <Button className='p-2' disabled={disabled} onClick={handleClick}>
      <GlobalVariable className='w-4 h-4 text-components-button-secondary-text' />
    </Button>
  )
}

export default memo(GlobalVariableButton)

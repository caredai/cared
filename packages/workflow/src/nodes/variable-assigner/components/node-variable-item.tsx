import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import cn from '@/utils/classnames'
import { VarBlockIcon } from '@/block-icon'
import { Line3 } from '@/base/icons/src/public/common'
import { Variable02 } from '@/base/icons/src/vender/solid/development'
import { BubbleX, Env } from '@/base/icons/src/vender/line/others'
import Badge from '@/base/badge'
import type { Node } from '@/types'
import { BlockEnum } from '@/types'

interface NodeVariableItemProps {
  isEnv: boolean
  isChatVar: boolean
  node: Node
  varName: string
  writeMode?: string
  showBorder?: boolean
  className?: string
  isException?: boolean
}

const i18nPrefix = 'workflow.nodes.assigner'

const NodeVariableItem = ({
  isEnv,
  isChatVar,
  node,
  varName,
  writeMode,
  showBorder,
  className,
  isException,
}: NodeVariableItemProps) => {
  const { t } = useTranslation()
  return (
    <div className={cn(
      'relative flex items-center p-[3px] pl-[5px] gap-1 self-stretch rounded-md bg-workflow-block-parma-bg',
      showBorder && '!bg-black/[0.02]',
      className,
    )}>
      {!isEnv && !isChatVar && (
        <div className='flex items-center'>
          <div className='p-[1px]'>
            <VarBlockIcon
              className='!text-gray-900'
              type={node?.data.type || BlockEnum.Start}
            />
          </div>
          <div className='max-w-[85px] truncate mx-0.5 text-xs font-medium text-gray-700' title={node?.data.title}>{node?.data.title}</div>
          <Line3 className='mr-0.5'></Line3>
        </div>
      )}
      <div className='flex items-center text-primary-600 w-full'>
        {!isEnv && !isChatVar && <Variable02 className={cn('shrink-0 w-3.5 h-3.5 text-primary-500', isException && 'text-text-warning')} />}
        {isEnv && <Env className='shrink-0 w-3.5 h-3.5 text-util-colors-violet-violet-600' />}
        {!isChatVar && <div className={cn('max-w-[75px] truncate ml-0.5 system-xs-medium overflow-hidden text-ellipsis', isEnv && 'text-gray-900', isException && 'text-text-warning')} title={varName}>{varName}</div>}
        {isChatVar
          && <div className='flex items-center w-full gap-1'>
            <div className='flex h-[18px] min-w-[18px] items-center gap-0.5 flex-1'>
              <BubbleX className='w-3.5 h-3.5 text-util-colors-teal-teal-700' />
              <div className={cn('max-w-[75px] truncate ml-0.5 system-xs-medium overflow-hidden text-ellipsis text-util-colors-teal-teal-700')}>{varName}</div>
            </div>
            {writeMode && <Badge className='shrink-0' text={t(`${i18nPrefix}.operations.${writeMode}`)} />}
          </div>
        }
      </div>
    </div>
  )
}

export default memo(NodeVariableItem)

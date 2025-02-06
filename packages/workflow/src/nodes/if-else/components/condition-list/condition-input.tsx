import { useTranslation } from 'react-i18next'
import { useStore } from '@/store'
import PromptEditor from '@/base/prompt-editor'
import { BlockEnum } from '@/types'
import type {
  Node,
  NodeOutPutVar,
} from '@/types'

interface ConditionInputProps {
  disabled?: boolean
  value: string
  onChange: (value: string) => void
  nodesOutputVars: NodeOutPutVar[]
  availableNodes: Node[]
}
const ConditionInput = ({
  value,
  onChange,
  disabled,
  nodesOutputVars,
  availableNodes,
}: ConditionInputProps) => {
  const { t } = useTranslation()
  const controlPromptEditorRerenderKey = useStore(s => s.controlPromptEditorRerenderKey)

  return (
    <PromptEditor
      key={controlPromptEditorRerenderKey}
      compact
      value={value}
      placeholder={t('workflow.nodes.ifElse.enterValue') || ''}
      workflowVariableBlock={{
        show: true,
        variables: nodesOutputVars || [],
        workflowNodesMap: availableNodes.reduce((acc, node) => {
          acc[node.id] = {
            title: node.data.title,
            type: node.data.type,
          }
          if (node.data.type === BlockEnum.Start) {
            acc.sys = {
              title: t('workflow.blocks.start'),
              type: BlockEnum.Start,
            }
          }
          return acc
        }, {} as any),
      }}
      onChange={onChange}
      editable={!disabled}
    />
  )
}

export default ConditionInput

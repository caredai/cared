import {
  faCloudArrowDown,
  faFileImport,
  faGear,
  faStar,
  faTags,
  faUserPlus,
  faUsers,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons'

import { TooltipFaButton } from '@/components/fa-button'

export function CharacterList() {
  const createActions = [
    {
      action: 'create',
      icon: faUserPlus,
      tooltip: 'Create New Character',
    },
    {
      action: 'import-file',
      icon: faFileImport,
      tooltip: 'Import Character from File',
    },
    {
      action: 'import-url',
      icon: faCloudArrowDown,
      tooltip: 'Import Character from external URL',
    },
    {
      action: 'create',
      icon: faUsersGear,
      tooltip: 'Create New Character Group',
    },
  ]

  const filterActions = [
    {
      action: 'show-favorites',
      icon: faStar,
      tooltip: 'Show only favorite characters',
    },
    {
      action: 'show-groups',
      icon: faUsers,
      tooltip: 'Show only groups',
    },
    {
      action: 'manage-tags',
      icon: faGear,
      tooltip: 'Manage tags',
    },
    {
      action: 'show-tags',
      icon: faTags,
      tooltip: 'Show tags',
    },
  ]

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row gap-1">
        {createActions.map(({ action, icon, tooltip }, index) => (
          <TooltipFaButton
            key={index}
            icon={icon}
            btnSize="size-8"
            iconSize="lg"
            tooltip={tooltip}
            className="text-foreground border-1 border-background hover:bg-muted-foreground rounded-sm"
          />
        ))}
      </div>

      <div className="flex flex-row gap-1">
        {filterActions.map(({ action, icon, tooltip }, index) => (
          <TooltipFaButton
            key={index}
            icon={icon}
            btnSize="size-8"
            iconSize="1x"
            tooltip={tooltip}
            className="border-1 border-ring/60 bg-ring/10 hover:border-ring hover:bg-ring rounded-full"
          />
        ))}
      </div>
    </div>
  )
}

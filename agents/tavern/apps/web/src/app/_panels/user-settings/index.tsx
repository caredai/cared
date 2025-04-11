import { useState } from 'react'

// Mock settings data
const mockSettings = {
  appearance: {
    theme: 'light',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
  },
  privacy: {
    shareData: false,
    allowAnalytics: true,
  },
}

// Settings section component
const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-md font-medium mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// Settings item component
const SettingsItem = ({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) => {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="font-medium">{label}</div>
        {description && <div className="text-sm text-gray-500">{description}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

// User Settings Panel Component
export function UserSettingsPanel() {
  const [settings, setSettings] = useState(mockSettings)

  // Update settings helper
  const updateSettings = (section: keyof typeof mockSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-4">User Settings</h2>
        <p className="text-sm text-gray-500">Manage your preferences and account settings</p>
      </div>

      {/* Appearance Settings */}
      <SettingsSection title="Appearance">
        <SettingsItem label="Theme">
          <select
            className="px-3 py-1 rounded border"
            value={settings.appearance.theme}
            onChange={(e) => updateSettings('appearance', 'theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </SettingsItem>

        <SettingsItem label="Font Size">
          <input
            type="number"
            className="px-3 py-1 rounded border w-20"
            value={settings.appearance.fontSize}
            onChange={(e) => updateSettings('appearance', 'fontSize', parseInt(e.target.value))}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection title="Notifications">
        <SettingsItem
          label="Enable Notifications"
          description="Receive notifications for important updates"
        >
          <input
            type="checkbox"
            checked={settings.notifications.enabled}
            onChange={(e) => updateSettings('notifications', 'enabled', e.target.checked)}
            className="w-5 h-5"
          />
        </SettingsItem>

        <SettingsItem label="Sound Notifications">
          <input
            type="checkbox"
            checked={settings.notifications.sound}
            onChange={(e) => updateSettings('notifications', 'sound', e.target.checked)}
            className="w-5 h-5"
          />
        </SettingsItem>
      </SettingsSection>

      {/* Privacy Settings */}
      <SettingsSection title="Privacy">
        <SettingsItem
          label="Share Usage Data"
          description="Help us improve by sharing anonymous usage data"
        >
          <input
            type="checkbox"
            checked={settings.privacy.shareData}
            onChange={(e) => updateSettings('privacy', 'shareData', e.target.checked)}
            className="w-5 h-5"
          />
        </SettingsItem>

        <SettingsItem label="Analytics" description="Allow analytics to improve your experience">
          <input
            type="checkbox"
            checked={settings.privacy.allowAnalytics}
            onChange={(e) => updateSettings('privacy', 'allowAnalytics', e.target.checked)}
            className="w-5 h-5"
          />
        </SettingsItem>
      </SettingsSection>
    </div>
  )
}

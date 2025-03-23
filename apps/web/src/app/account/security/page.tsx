'use client'

import { useState } from 'react'

import { Button } from '@mindworld/ui/components/button'

export default function Page() {
  // State for managing active devices
  const [devices] = useState([
    {
      id: '1',
      type: 'Windows',
      isThisDevice: true,
      browser: 'Chrome 134.0.0.0',
      ipAddress: '47.242.238.132',
      location: 'Hong Kong, HK',
      lastActive: 'Today at 4:31 PM',
    },
    {
      id: '2',
      type: 'Linux',
      isThisDevice: false,
      browser: 'Chrome 134.0.0.0',
      ipAddress: '47.242.238.132',
      location: 'Hong Kong, HK',
      lastActive: 'Yesterday at 10:15 AM',
    },
  ])

  // Function to set password
  const handleSetPassword = () => {
    // Implementation would connect to authClient
    console.log('Set password clicked')
  }

  // Function to add passkey
  const handleAddPasskey = () => {
    // Implementation would connect to authClient
    console.log('Add passkey clicked')
  }

  // Function to add two-step verification
  const handleAddTwoStep = () => {
    // Implementation would connect to authClient
    console.log('Add two-step verification clicked')
  }

  // Function to handle device options
  const handleDeviceOptions = (deviceId: string) => {
    // Implementation would show device options
    console.log('Options for device', deviceId)
  }

  // Function to delete account
  const handleDeleteAccount = () => {
    // Implementation would connect to authClient
    console.log('Delete account clicked')
  }

  return (
    <div className="container mx-auto py-6">
      {/* Password Section */}
      <div className="flex items-center justify-between py-3 border-b">
        <div>
          <h3 className="font-medium">Password</h3>
        </div>
        <Button
          variant="link"
          className="text-blue-600 hover:underline"
          onClick={handleSetPassword}
        >
          Set password
        </Button>
      </div>

      {/* Passkeys Section */}
      <div className="flex items-center justify-between py-3 border-b">
        <div>
          <h3 className="font-medium">Passkeys</h3>
        </div>
        <Button variant="outline" className="flex items-center gap-1" onClick={handleAddPasskey}>
          <span>+</span> Add a passkey
        </Button>
      </div>

      {/* Two-step verification Section */}
      <div className="flex items-center justify-between py-3 border-b">
        <div>
          <h3 className="font-medium">Two-step verification</h3>
        </div>
        <Button variant="outline" className="flex items-center gap-1" onClick={handleAddTwoStep}>
          <span>+</span> Add two-step verification
        </Button>
      </div>

      {/* Active devices Section */}
      <div className="space-y-4 py-3 border-b">
        <h3 className="font-medium">Active devices</h3>

        <div className="space-y-6">
          {devices.map((device) => (
            <div key={device.id} className="flex items-start gap-3">
              <div className="mt-1">
                {device.type === 'Windows' ? (
                  <div className="w-6 h-6 bg-black rounded-sm"></div>
                ) : (
                  <div className="w-5 h-6 bg-black rounded-sm"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{device.type}</span>
                    {device.isThisDevice && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        This device
                      </span>
                    )}
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => handleDeviceOptions(device.id)}
                  >
                    •••
                  </button>
                </div>
                <div className="text-sm text-gray-500">{device.browser}</div>
                <div className="text-sm text-gray-500">
                  {device.ipAddress} ({device.location})
                </div>
                <div className="text-sm text-gray-500">{device.lastActive}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete account Section */}
      <div className="flex items-center justify-between py-3">
        <div>
          <h3 className="font-medium">Delete account</h3>
        </div>
        <Button
          variant="link"
          className="text-red-600 hover:underline"
          onClick={handleDeleteAccount}
        >
          Delete account
        </Button>
      </div>
    </div>
  )
}

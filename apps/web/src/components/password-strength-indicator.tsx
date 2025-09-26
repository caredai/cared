import * as React from 'react'
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'

// Configure zxcvbn options
const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
}

zxcvbnOptions.setOptions(options)

interface PasswordStrengthIndicatorProps {
  password: string
}

/**
 * Password strength indicator component that shows password strength using zxcvbn
 * @param password - The password to evaluate
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const result = React.useMemo(() => {
    if (!password) return null
    return zxcvbn(password)
  }, [password])

  if (!result) return null

  const getScoreColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500'
      case 2:
        return 'bg-yellow-500'
      case 3:
        return 'bg-blue-500'
      case 4:
        return 'bg-green-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getScoreText = (score: number) => {
    switch (score) {
      case 0:
        return 'Very Weak'
      case 1:
        return 'Weak'
      case 2:
        return 'Fair'
      case 3:
        return 'Good'
      case 4:
        return 'Strong'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              level <= result.score ? getScoreColor(result.score) : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Score text */}
      <div className="flex items-center justify-between text-sm">
        <span
          className={`font-medium ${
            result.score <= 1
              ? 'text-red-600'
              : result.score === 2
                ? 'text-yellow-600'
                : result.score === 3
                  ? 'text-blue-600'
                  : 'text-green-600'
          }`}
        >
          {getScoreText(result.score)}
        </span>
      </div>
    </div>
  )
}

/**
 * Custom password validation function using zxcvbn
 * @param password - The password to validate
 * @returns Validation result with success status and error message if applicable
 */
export function validatePasswordStrength(password: string) {
  if (!password) return { success: false, error: { message: 'Password is required' } }

  const result = zxcvbn(password)

  if (result.score <= 2) {
    const feedback = result.feedback
    let errorMessage = 'Password is too weak'

    if (feedback.warning) {
      errorMessage = feedback.warning
    } else if (feedback.suggestions.length > 0) {
      errorMessage = feedback.suggestions[0]!
    }

    return { success: false, error: { message: errorMessage } }
  }

  return { success: true }
}

import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'

import { cn } from '../lib/utils'

/**
 * Smooth scrolling number counter component
 * Simulates smooth transition effect when number changes to new value
 * @param {number} value - Target number value
 * @param {number} duration=1 - Animation duration in seconds
 * @param {string} className - Tailwind CSS class name for container
 * @param {number} decimalPlaces=0 - Decimal places, defaults to 0 (integer)
 * @param {string} prefix='' - Number prefix
 * @param {string} suffix='' - Number suffix
 */
export function NumberTicker({
  value,
  duration = 1,
  className,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
}: {
  value: number
  duration?: number
  className?: string
  decimalPlaces?: number
  prefix?: string
  suffix?: string
}) {
  // Create a MotionValue to track the current number during animation
  const count = useMotionValue(0) // Initial value is 0

  // Use useTransform to format the MotionValue as a string
  // It can handle decimal places, prefix and suffix
  const rounded = useTransform(count, (latest) => {
    // Ensure the number is valid and round it
    const num = parseFloat(latest.toFixed(decimalPlaces))
    return `${prefix}${num.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })}${suffix}`
  })

  // Trigger animation when value changes
  useEffect(() => {
    // Use animate function to animate count MotionValue from current value to new value
    const controls = animate(count, value, {
      duration: duration,
      ease: 'easeOut', // Animation easing function
    })

    // Return cleanup function to stop animation when component unmounts or value changes again
    return controls.stop
  }, [value, count, duration, decimalPlaces, prefix, suffix]) // Dependencies

  return <motion.span className={cn('inline-block', className)}>{rounded}</motion.span>
}

export default NumberTicker

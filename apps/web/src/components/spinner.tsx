import { LoaderCircle, LoaderIcon, LoaderPinwheel } from 'lucide-react'

export function Spinner() {
  return <LoaderIcon className="animate-spin" />
}

export function CircleSpinner() {
  return <LoaderCircle className="animate-spin" />
}

export function PinwheelSpinner() {
  return <LoaderPinwheel className="animate-spin" />
}

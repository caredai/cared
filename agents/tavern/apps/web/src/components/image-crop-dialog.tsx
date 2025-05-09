import type { Area } from 'react-easy-crop'
import { useEffect, useState } from 'react'
import { getOrientation } from 'get-orientation/browser'
import Cropper from 'react-easy-crop'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ownxai/ui/components/dialog'

import { getCroppedImg, getRotatedImage } from '@/lib/canvas-utils'

const ORIENTATION_TO_ANGLE = {
  '3': 180,
  '6': 90,
  '8': -90,
} as const

export function ImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCrop,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageFile?: File
  onCrop: (croppedImage: string) => void
}) {
  const [imageSrc, setImageSrc] = useState<string>()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>()

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  useEffect(() => {
    void (async function () {
      if (!imageFile) {
        setImageSrc(undefined)
        return
      }

      let imageDataUrl = await readAsDataURL(imageFile)

      try {
        // Apply rotation if needed
        const orientation = await getOrientation(imageFile)
        // @ts-ignore
        const rotation = ORIENTATION_TO_ANGLE[orientation]
        if (rotation) {
          imageDataUrl = await getRotatedImage(imageDataUrl, rotation)
        }
      } catch (err) {
        console.warn('failed to detect the orientation:', err)
      }

      setImageSrc(imageDataUrl)
    })()
  }, [imageFile])

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return
    }
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
    onCrop(croppedImage)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] z-6000">
        <DialogHeader>
          <DialogTitle>Crop character image</DialogTitle>
        </DialogHeader>
        <div className="w-full h-[60dvh] relative">
          <Cropper
            image={imageSrc}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={2 / 3}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>Crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result as string), false)
    reader.readAsDataURL(file)
  })
}

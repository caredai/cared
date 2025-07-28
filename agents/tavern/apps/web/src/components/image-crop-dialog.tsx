import type { Area } from 'react-easy-crop'
import { useEffect, useRef, useState } from 'react'
import { getOrientation } from 'get-orientation/browser'
import Cropper from 'react-easy-crop'

import { Button } from '@cared/ui/components/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@cared/ui/components/dialog'

import { getCroppedImg, getRotatedImage } from '@/lib/canvas-utils'

const ORIENTATION_TO_ANGLE = {
  '3': 180,
  '6': 90,
  '8': -90,
} as const

function ImageCropper({
  imageFile,
  onCrop,
  render,
}: {
  imageFile: File
  onCrop: (croppedImage: string) => void
  render: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 })

  const [imageSrc, setImageSrc] = useState<string>()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>()

  // Get container size for cropSize
  useEffect(() => {
    const updateCropSize = (entries: ResizeObserverEntry[]) => {
      const box = entries[0]?.contentBoxSize[0]
      if (box) {
        setCropSize({ width: box.inlineSize, height: box.blockSize })
      }
    }

    const resizeObserver = new ResizeObserver(updateCropSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  useEffect(() => {
    void (async function () {
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
  }

  return (
    <>
      <div ref={containerRef} className="w-full aspect-2/3 relative">
        {render && (
          <Cropper
            image={imageSrc}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            cropSize={cropSize}
            zoomSpeed={0.2}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => onCrop('')}>
          Cancel
        </Button>
        <Button onClick={handleCrop}>Crop</Button>
      </div>
    </>
  )
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCrop,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageFile?: File
  onCrop: (croppedImage: string) => void
  title: string
}) {
  const [render, setRender] = useState(false)

  // Fix: https://github.com/ValentinH/react-easy-crop?tab=readme-ov-file#the-cropper-size-isnt-correct-when-displayed-in-a-modal
  useEffect(() => {
    if (open) {
      setTimeout(() => setRender(true), 500)
    } else {
      setRender(false)
    }
  }, [open])

  const handleCrop = (croppedImage: string) => {
    if (croppedImage === '') {
      // Cancel action
      onOpenChange(false)
    } else {
      // Actual crop action
      onCrop(croppedImage)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] z-6000">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open && imageFile && (
          <ImageCropper imageFile={imageFile} onCrop={handleCrop} render={render} />
        )}
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

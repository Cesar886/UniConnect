'use client'

import { useState, useRef, useEffect } from 'react'

const CROP_W = 260
const CROP_H = 325  // 4:5
const OUT_W = 800
const OUT_H = 1000

export interface CropParams {
  x: number
  y: number
  scale: number
}

interface Props {
  file: File
  initialParams?: CropParams
  onConfirm: (blob: Blob, params: CropParams) => void
  onCancel: () => void
}

export default function PhotoCropModal({ file, initialParams, onConfirm, onCancel }: Props) {
  const [offset, setOffset] = useState({ x: initialParams?.x ?? 0, y: initialParams?.y ?? 0 })
  const [scale, setScale] = useState(initialParams?.scale ?? 1)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [imgUrl, setImgUrl] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const touchRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const baseScale = naturalSize.w && naturalSize.h
    ? Math.max(CROP_W / naturalSize.w, CROP_H / naturalSize.h)
    : 1

  const actualScale = baseScale * scale

  const maxOffX = Math.max(0, (naturalSize.w * actualScale - CROP_W) / 2)
  const maxOffY = Math.max(0, (naturalSize.h * actualScale - CROP_H) / 2)
  const cx = Math.max(-maxOffX, Math.min(maxOffX, offset.x))
  const cy = Math.max(-maxOffY, Math.min(maxOffY, offset.y))

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { x: e.clientX, y: e.clientY, ox: cx, oy: cy }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    })
  }
  const onMouseUp = () => { dragRef.current = null }

  // Touch: drag con 1 dedo, pinch-zoom con 2
  const getDist = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      pinchRef.current = null
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ox: cx, oy: cy }
    } else if (e.touches.length === 2) {
      touchRef.current = null
      pinchRef.current = { dist: getDist(e.touches), scale }
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchRef.current) {
      setOffset({
        x: touchRef.current.ox + (e.touches[0].clientX - touchRef.current.x),
        y: touchRef.current.oy + (e.touches[0].clientY - touchRef.current.y),
      })
    } else if (e.touches.length === 2 && pinchRef.current) {
      const newDist = getDist(e.touches)
      const next = pinchRef.current.scale * (newDist / pinchRef.current.dist)
      setScale(Math.min(3, Math.max(1, next)))
    }
  }

  const handleConfirm = () => {
    const img = imgRef.current
    if (!img || !naturalSize.w) return
    const canvas = document.createElement('canvas')
    canvas.width = OUT_W
    canvas.height = OUT_H
    const ctx = canvas.getContext('2d')!
    const sx = naturalSize.w / 2 - (CROP_W / 2 + cx) / actualScale
    const sy = naturalSize.h / 2 - (CROP_H / 2 + cy) / actualScale
    const sw = CROP_W / actualScale
    const sh = CROP_H / actualScale
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H)
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob, { x: cx, y: cy, scale })
    }, 'image/webp', 0.85)
  }

  const imgLeft = CROP_W / 2 + cx - naturalSize.w * actualScale / 2
  const imgTop  = CROP_H / 2 + cy - naturalSize.h * actualScale / 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-auto py-6 px-6 shadow-2xl">

        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Ajusta tu foto</h2>
        <p className="text-sm text-gray-400 mt-1 mb-5">Arrastra para mover · pellizca para zoom</p>

        {/* Crop frame */}
        <div
          className="mx-auto overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing touch-none select-none border border-gray-100 shadow-inner"
          style={{ width: CROP_W, height: CROP_H, position: 'relative', background: '#f3f4f6' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { touchRef.current = null }}
        >
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={imgUrl}
              alt="preview"
              draggable={false}
              onLoad={(e) => {
                const t = e.currentTarget
                setNaturalSize({ w: t.naturalWidth, h: t.naturalHeight })
              }}
              style={{
                position: 'absolute',
                width: naturalSize.w * actualScale,
                height: naturalSize.h * actualScale,
                left: imgLeft,
                top: imgTop,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Grid overlay sutil */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: `${CROP_W / 3}px ${CROP_H / 3}px`,
          }} />
        </div>

        {/* Zoom control */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => setScale(s => Math.max(1, +(s - 0.15).toFixed(2)))}
            className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 text-xl font-bold flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
          >−</button>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((scale - 1) / 2) * 100)}%` }}
            />
          </div>
          <button
            onClick={() => setScale(s => Math.min(3, +(s + 0.15).toFixed(2)))}
            className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 text-xl font-bold flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
          >+</button>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3.5 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 active:scale-95 transition-all"
          >
            Usar foto
          </button>
        </div>
      </div>
    </div>
  )
}

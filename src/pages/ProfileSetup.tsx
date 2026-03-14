import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useParticipant } from '../hooks/useParticipant'
import { useCategories } from '../hooks/useCategories'
import { supabase } from '../lib/supabase'

// Utility: create a cropped image blob from the source
async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const size = 256 // output size
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    img,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, size, size,
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.85)
  })
}

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { createParticipant, restoreByPin } = useParticipant()
  const { categories } = useCategories()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [hostExists, setHostExists] = useState(true) // default true to hide until checked
  const [submitting, setSubmitting] = useState(false)
  const [showRestore, setShowRestore] = useState(false)
  const [restoreName, setRestoreName] = useState('')
  const [restorePin, setRestorePin] = useState('')
  const [restoreError, setRestoreError] = useState(false)

  // Photo state
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState<Area | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Check if a host already exists
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from('participants')
        .select('id')
        .eq('is_admin', true)
        .limit(1)
      setHostExists(!!data && data.length > 0)
    }
    check()
  }, [])

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCropArea(croppedAreaPixels)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoSrc(reader.result as string)
      setShowCropper(true)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleCropConfirm = async () => {
    if (!photoSrc || !cropArea) return
    const blob = await getCroppedBlob(photoSrc, cropArea)
    const preview = URL.createObjectURL(blob)
    setCroppedPreview(preview)
    setShowCropper(false)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setPhotoSrc(null)
  }

  const handleRemovePhoto = () => {
    setPhotoSrc(null)
    setCroppedPreview(null)
    setCropArea(null)
  }

  const canSubmit = name.trim().length >= 2

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)

    let photoUrl: string | null = null

    // Upload cropped photo if available
    if (croppedPreview && photoSrc && cropArea) {
      try {
        const blob = await getCroppedBlob(photoSrc, cropArea)
        const filename = `${Date.now()}-${name.trim().toLowerCase().replace(/\s+/g, '-')}.webp`
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filename, blob, { contentType: 'image/webp' })

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.path)
          photoUrl = urlData.publicUrl
        }
      } catch (err) {
        console.error('Photo upload failed:', err)
        // Continue without photo
      }
    }

    const participant = await createParticipant(
      name.trim(),
      photoUrl,
      pin.trim() || null,
      isAdmin,
    )

    if (participant) {
      const slug = categories[0]?.slug ?? 'best-picture'
      window.location.href = `/ballot/${slug}`
    } else {
      setSubmitting(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreName.trim() || !restorePin.trim()) return
    setRestoreError(false)
    const p = await restoreByPin(restoreName.trim(), restorePin.trim())
    if (p) {
      if (p.locked_at) {
        navigate('/insights')
      } else {
        navigate(`/ballot/${categories[0]?.slug ?? 'best-picture'}`)
      }
    } else {
      setRestoreError(true)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      {/* Crop Modal */}
      <AnimatePresence>
        {showCropper && photoSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-velvet/95 flex flex-col"
          >
            <div className="pt-[calc(12px+var(--safe-top))] px-4 pb-2 text-center">
              <p className="text-ivory font-serif text-lg font-semibold">Crop Your Photo</p>
              <p className="text-ivory-dim text-xs mt-1">Pinch to zoom · Drag to position</p>
            </div>
            <div className="flex-1 relative">
              <Cropper
                image={photoSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-4 pb-[calc(16px+var(--safe-bottom))] flex gap-3">
              <button
                onClick={handleCropCancel}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium bg-charcoal text-ivory-dim"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleCropConfirm}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold-dim via-gold to-gold-dim text-velvet"
                whileTap={{ scale: 0.97 }}
              >
                Use Photo
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Title */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="font-serif text-5xl font-bold shimmer mb-3 leading-tight">
          The Evvies
        </h1>
        <p className="text-ivory-dim text-sm tracking-widest uppercase">
          The Evans Family Oscar Ballot 2026
        </p>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        className="w-full max-w-sm space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Profile Photo */}
        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {croppedPreview ? (
            <div className="relative">
              <img
                src={croppedPreview}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gold/40"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-charcoal border border-charcoal-light text-ivory-dim text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-charcoal border-2 border-dashed border-charcoal-light flex flex-col items-center justify-center gap-1 hover:border-gold/30 transition-colors"
            >
              <span className="text-2xl">📷</span>
            </button>
          )}
          <button
            onClick={() => croppedPreview ? handleRemovePhoto() : fileInputRef.current?.click()}
            className="text-ivory-dim/50 text-xs"
          >
            {croppedPreview ? 'Change photo' : 'Add profile photo'}{' '}
            <span className="text-ivory-dim/30">(recommended)</span>
          </button>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-ivory-dim text-xs uppercase tracking-wider mb-2 font-medium">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-charcoal border border-charcoal-light rounded-xl px-4 py-3.5 text-ivory placeholder-ivory-dim/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors text-base"
            autoComplete="off"
            maxLength={30}
          />
        </div>

        {/* PIN Input */}
        <div>
          <label className="block text-ivory-dim text-xs uppercase tracking-wider mb-2 font-medium">
            Recovery PIN <span className="text-ivory-dim/40">(optional)</span>
          </label>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit PIN"
            inputMode="numeric"
            className="w-full bg-charcoal border border-charcoal-light rounded-xl px-4 py-3.5 text-ivory placeholder-ivory-dim/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors text-base"
            maxLength={4}
          />
          <p className="text-ivory-dim/40 text-xs mt-1.5">
            Use this to recover your ballot on another device
          </p>
        </div>

        {/* Admin Toggle — hidden if host already exists */}
        {!hostExists && (
          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-4 h-4 rounded bg-charcoal border-charcoal-light accent-gold"
            />
            <span className="text-ivory-dim/40 text-xs">I'm the host</span>
          </label>
        )}

        {/* Submit Button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all touch-target ${
            canSubmit
              ? 'bg-gradient-to-r from-gold-dim via-gold to-gold-dim text-velvet shadow-lg shadow-gold/20'
              : 'bg-charcoal text-ivory-dim/40 cursor-not-allowed'
          }`}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
        >
          {submitting ? (
            <span className="shimmer">Creating Profile...</span>
          ) : (
            'Enter the Ballot →'
          )}
        </motion.button>

        {/* Restore Link */}
        <div className="text-center pt-2">
          <button
            onClick={() => setShowRestore(!showRestore)}
            className="text-ivory-dim/50 text-xs underline underline-offset-2"
          >
            Returning on a new device?
          </button>
        </div>

        {/* Restore Form */}
        <AnimatePresence>
          {showRestore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3"
            >
              <div className="glass-card p-4 space-y-3">
                <p className="text-ivory-dim text-xs">Enter your name and PIN to restore your ballot.</p>
                <input
                  type="text"
                  value={restoreName}
                  onChange={(e) => setRestoreName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-velvet border border-charcoal-light rounded-lg px-3 py-2.5 text-ivory text-sm placeholder-ivory-dim/40 focus:outline-none focus:border-gold/50"
                />
                <input
                  type="text"
                  value={restorePin}
                  onChange={(e) => setRestorePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4-digit PIN"
                  inputMode="numeric"
                  className="w-full bg-velvet border border-charcoal-light rounded-lg px-3 py-2.5 text-ivory text-sm placeholder-ivory-dim/40 focus:outline-none focus:border-gold/50"
                  maxLength={4}
                />
                {restoreError && (
                  <p className="text-crimson-light text-xs">No match found. Check your name and PIN.</p>
                )}
                <button
                  onClick={handleRestore}
                  className="w-full py-2.5 rounded-lg bg-charcoal-light text-ivory text-sm font-medium"
                >
                  Restore Ballot
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

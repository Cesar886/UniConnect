'use client'

import { useState, useRef } from 'react'

const CARRERAS = [
  'Administración de Empresas',
  'Arquitectura',
  'Comunicación',
  'Contabilidad',
  'Derecho',
  'Diseño Gráfico',
  'Educación',
  'Enfermería',
  'Gastronomía',
  'Ingeniería Civil',
  'Ingeniería en Computación',
  'Ingeniería en Sistemas',
  'Ingeniería Industrial',
  'Ingeniería Mecatrónica',
  'Ingeniería Química',
  'Internacionalización de Negocios',
  'Medicina',
  'Mercadotecnia',
  'Nutrición',
  'Odontología',
  'Psicología',
  'Relaciones Internacionales',
  'Trabajo Social',
  'Turismo',
]
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import { uploadProfilePhoto, removeProfilePhoto, saveOriginalPhoto } from '@/app/actions/upload'
import { saveProfileData } from '@/app/actions/students'
import { safePhotoUrl } from '@/lib/sanitize'
import PhotoCropModal, { CropParams } from '@/components/PhotoCropModal'

const INTERESES_CATEGORIAS = [
  {
    nombre: 'Deportes',
    colorOff: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
    colorOn: 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30',
    hobbies: ['Fútbol', 'Pádel', 'Básquetbol', 'Tenis', 'Voleibol', 'Gimnasio', 'Natación', 'Correr']
  },
  {
    nombre: 'Arte & Entretenimiento',
    colorOff: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
    colorOn: 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/30',
    hobbies: ['Cine', 'Netflix / Series', 'Videojuegos', 'Música', 'Tocar Instrumentos', 'Fotografía', 'Dibujo', 'Teatro']
  },
  {
    nombre: 'Estilo de Vida Social',
    colorOff: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100',
    colorOn: 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/30',
    hobbies: ['Ir por Café', 'Viajar', 'Conciertos', 'Mascotas', 'Fiestas', 'Lectura', 'Juegos de Mesa', 'Cocinar']
  },
  {
    nombre: 'Académico / Emprendedor',
    colorOff: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
    colorOn: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30',
    hobbies: ['Tecnología', 'Programar', 'Emprendimiento', 'Debate', 'Voluntariado', 'Aprender Idiomas', 'Proyectos']
  }
]

export default function ProfilePage() {
  const { userProfile, updateProfile, logout } = useApp()
  const router = useRouter()

  // Estado para controlar el modo de vista (Visualización vs Edición)
  const [isEditing, setIsEditing] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const carouselTouchStart = useRef(0)
  const [saved, setSaved] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado del Formulario
  const [name, setName] = useState(userProfile.name)
  const [age, setAge] = useState(String(userProfile.age))
  const [career, setCareer] = useState(userProfile.career)
  const [semester, setSemester] = useState(String(userProfile.semester))
  const [bio, setBio] = useState(userProfile.bio)
  const [interests, setInterests] = useState<string[]>(userProfile.interests)

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 6
        ? [...prev, interest]
        : prev
    )
  }

  const [uploadingSlot, setUploadingSlot] = useState<1 | 2 | 3 | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [initialCropParams, setInitialCropParams] = useState<CropParams | undefined>(undefined)

  const cropKey = (slot: number) => `umatch_crop_${userProfile.matricula}_slot${slot}`

  const triggerUpload = (slot: 1 | 2 | 3) => {
    setUploadingSlot(slot)
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleDeletePhoto = async (slot: 1 | 2 | 3) => {
    if (!userProfile.matricula) return
    const res = await removeProfilePhoto(slot)
    if (res.success) {
      const newPhotos = [...(userProfile.photos || ['', '', ''])]
      newPhotos[slot - 1] = ''
      updateProfile({ photos: newPhotos, photo: slot === 1 ? '' : userProfile.photo })
    }
  }

  // Editar foto existente: usa el original guardado en el servidor
  const editExistingPhoto = async (slot: 1 | 2 | 3) => {
    if (!userProfile.matricula) return
    setUploadingSlot(slot)
    // Restaurar parámetros de recorte previos si existen
    try {
      const saved = localStorage.getItem(cropKey(slot))
      setInitialCropParams(saved ? JSON.parse(saved) : undefined)
    } catch {
      setInitialCropParams(undefined)
    }
    // Intenta cargar el original; si no existe, cae al recortado actual
    const origUrl = `/uploads/${userProfile.matricula}-slot${slot}-orig.webp`
    const fallbackUrl = (userProfile.photos || [])[slot - 1]
    try {
      const res = await fetch(origUrl)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      setCropFile(new File([blob], 'photo.webp', { type: blob.type || 'image/webp' }))
    } catch {
      // Si el original no existe, intenta con la foto actual
      try {
        const res2 = await fetch(fallbackUrl)
        const blob2 = await res2.blob()
        setCropFile(new File([blob2], 'photo.webp', { type: blob2.type || 'image/webp' }))
      } catch {
        alert('No se pudo cargar la foto para editar.')
        setUploadingSlot(null)
      }
    }
  }

  // Paso 1: archivo seleccionado → convertir a webp, guardar original en paralelo y abrir modal
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile.matricula || !uploadingSlot) return
    if (fileInputRef.current) fileInputRef.current.value = ''
    const slot = uploadingSlot

    setInitialCropParams(undefined)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (ev) => {
      const img = new Image()
      img.src = ev.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d')?.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          if (!blob) return
          const webpFile = new File([blob], 'photo.webp', { type: 'image/webp' })
          // Guardar original webp en background
          const origForm = new FormData()
          origForm.append('file', webpFile, 'photo.webp')
          saveOriginalPhoto(slot, origForm)
          // Abrir modal de recorte
          setCropFile(webpFile)
        }, 'image/webp', 0.92)
      }
    }
  }

  // Paso 2: blob recortado confirmado → subir y guardar params
  const uploadCroppedBlob = async (blob: Blob, params: CropParams) => {
    setCropFile(null)
    if (!uploadingSlot) return
    setIsUploading(true)
    const slot = uploadingSlot
    try {
      const formData = new FormData()
      formData.append('file', blob, 'photo.webp')
      const res = await uploadProfilePhoto(slot, formData)
      if (res.success && res.photoUrl) {
        // Guardar params en localStorage para restaurar al re-editar
        try { localStorage.setItem(cropKey(slot), JSON.stringify(params)) } catch { }
        const newPhotos = [...(userProfile.photos || ['', '', ''])]
        newPhotos[slot - 1] = res.photoUrl
        updateProfile({ photos: newPhotos, photo: slot === 1 ? res.photoUrl : userProfile.photo })
      } else {
        alert('Error guardando la foto.')
      }
    } catch { }
    setIsUploading(false)
    setUploadingSlot(null)
  }

  const handleSave = async () => {
    const parsedAge = parseInt(age) || 18
    const parsedSemester = parseInt(semester) || 1
    const res = await saveProfileData({
      nombre: name,
      edad: parsedAge,
      carrera: career,
      semestre: parsedSemester,
      bio,
      intereses: interests.join(', '),
    })
    if (!res.success) {
      alert('Error al guardar. Intenta de nuevo.')
      return
    }
    updateProfile({ name, age: parsedAge, career, semester: parsedSemester, bio, interests })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setIsEditing(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

      {cropFile && (
        <PhotoCropModal
          file={cropFile}
          initialParams={initialCropParams}
          onConfirm={(blob, params) => uploadCroppedBlob(blob, params)}
          onCancel={() => { setCropFile(null); setUploadingSlot(null) }}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white/70 backdrop-blur-2xl z-40 px-6 py-5 flex justify-between items-center border-b border-gray-100/50">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-pink-500 transition-colors p-2 -ml-2 rounded-full hover:bg-pink-50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 tracking-tight drop-shadow-sm">
          {isEditing ? 'Editar Perfil' : 'Tu Perfil'}
        </h1>
        {isEditing ? (
          <div className="w-10" />
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-pink-500 transition-colors p-2 -mr-2 rounded-full hover:bg-pink-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
            </svg>
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">

        {!isEditing ? (
          /* =========================================
             VISTA MODO "TINDER CARD" (Lectura)
          ========================================= */
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {/* Tarjeta Principal */}
            <div className="mb-6 relative">

              {/* Carrusel de Fotos */}
              {(() => {
                const allPhotos = (userProfile.photos || []).filter(Boolean)
                const visiblePhotos = allPhotos.length > 0 ? allPhotos : ['']
                const clampedIndex = Math.min(photoIndex, visiblePhotos.length - 1)
                return (
                  <div
                    className="w-full aspect-[4/5] bg-gradient-to-br from-pink-400 via-rose-400 to-violet-500 relative flex items-center justify-center overflow-hidden select-none rounded-t-[2rem]"
                    onTouchStart={(e) => { carouselTouchStart.current = e.touches[0].clientX }}
                    onTouchEnd={(e) => {
                      const delta = e.changedTouches[0].clientX - carouselTouchStart.current
                      if (delta < -50 && clampedIndex < visiblePhotos.length - 1) setPhotoIndex(clampedIndex + 1)
                      if (delta > 50 && clampedIndex > 0) setPhotoIndex(clampedIndex - 1)
                    }}
                  >
                    {visiblePhotos[clampedIndex] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={safePhotoUrl(visiblePhotos[clampedIndex])} alt="Mi Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/40 text-9xl font-black tracking-tighter">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {/* Indicadores de foto (dots) */}
                    {visiblePhotos.length > 1 && (
                      <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4 pointer-events-none">
                        {visiblePhotos.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === clampedIndex ? 'bg-white w-6' : 'bg-white/50 w-3'}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Zonas de tap para navegar */}
                    {clampedIndex > 0 && (
                      <button
                        onClick={() => setPhotoIndex(clampedIndex - 1)}
                        className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                        aria-label="Foto anterior"
                      />
                    )}
                    {clampedIndex < visiblePhotos.length - 1 && (
                      <button
                        onClick={() => setPhotoIndex(clampedIndex + 1)}
                        className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                        aria-label="Foto siguiente"
                      />
                    )}
                  </div>
                )
              })()}

              {/* Contenido (Bio y Gustos) — se encima sobre la foto */}
              <div className="bg-white rounded-t-3xl -mt-10 relative z-10 px-6 pt-7 pb-6 shadow-[0_-8px_24px_rgba(0,0,0,0.10)]">

                {/* Nombre, edad y carrera — ahora en el card */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
                      {name} <span className="text-2xl font-semibold text-gray-400">{age}</span>
                    </h2>
                    <div className="flex items-center gap-1.5 mt-2 text-gray-500 font-medium text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-pink-400 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                      </svg>
                      <span>{career} · {semester}º Sem</span>
                    </div>
                  </div>
                  {/* Botón de cámara */}
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isUploading}
                    className="bg-gray-100 text-gray-500 rounded-full p-3 hover:bg-pink-50 hover:text-pink-500 transition-all active:scale-95 shrink-0"
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="w-full h-px bg-gray-100 mb-6" />

                <div className="mb-6">
                  <h3 className="uppercase tracking-widest text-xs font-bold text-gray-400 mb-2">Sobre mí</h3>
                  <p className="text-gray-800 text-lg leading-relaxed">{bio || "Aún no he escrito nada sobre mí."}</p>
                </div>

                <div>
                  <h3 className="uppercase tracking-widest text-xs font-bold text-gray-400 mb-3">Mis Gustos</h3>
                  <div className="flex flex-wrap gap-2">
                    {interests.length > 0 ? interests.map((interest) => (
                      <span key={interest} className="px-4 py-2 bg-pink-50 text-pink-600 border border-pink-100 rounded-full text-sm font-semibold">
                        {interest}
                      </span>
                    )) : (
                      <span className="text-gray-400 italic text-sm">Sin intereses seleccionados.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(true)}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-gray-900 text-white shadow-lg shadow-gray-900/20 hover:-translate-y-1 transition-all"
            >
              Editar Perfil
            </button>
            
            <div className="mt-8 text-center pt-8 border-t border-gray-200">
               <button
                 onClick={() => {
                   logout()
                   router.push('/login')
                 }}
                 className="text-gray-400 font-bold hover:text-red-500 transition-colors"
               >
                 Cerrar sesión de forma segura
               </button>
            </div>
          </div>
        ) : (
          /* =========================================
             VISTA MODO "FORMULARIO" (Edición)
          ========================================= */
          <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6">

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Tus Fotos (1-3)</h3>
                {isUploading && <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>}
              </div>
              <p className="text-xs text-gray-400 mb-4">Agrega hasta 3 fotos a tu perfil. La primera es la principal.</p>
              
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((slot) => {
                  const url = userProfile.photos ? userProfile.photos[slot - 1] : ''
                  return (
                    <div key={slot} className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 transition-colors group flex items-center justify-center">
                      {url ? (
                        <>
                          <img src={safePhotoUrl(url)} alt={`Foto ${slot}`} className="w-full h-full object-cover" />
                          
                          {/* Eliminar — arriba derecha */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(slot as 1|2|3) }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md transition-colors z-10 active:scale-90"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" /></svg>
                          </button>

                          {/* Editar foto — abajo derecha */}
                          <button
                            onClick={(e) => { e.stopPropagation(); editExistingPhoto(slot as 1|2|3) }}
                            className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white hover:text-gray-900 transition-colors z-10 active:scale-90"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button onClick={() => triggerUpload(slot as 1|2|3)} className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-pink-500 transition-colors z-10 active:scale-90">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">Información Básica</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-xl outline-none transition-all text-gray-900 font-medium text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Edad</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="17"
                      max="30"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-xl outline-none transition-all text-gray-900 font-medium text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Semestre</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-xl outline-none transition-all text-gray-900 font-medium appearance-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}º</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Carrera</label>
                  <select
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-xl outline-none transition-all text-gray-900 font-medium appearance-none"
                  >
                    <option value="">Selecciona tu carrera</option>
                    {CARRERAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
                    Bio <span className="font-normal">({bio.length}/150)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={150}
                    rows={3}
                    placeholder="Cuéntate algo interesante..."
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-xl outline-none transition-all text-gray-900 font-medium resize-none shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-2">Intereses Seleccionados <span className="text-pink-500 normal-case font-normal ml-1">({interests.length}/6)</span></h3>
              <p className="text-sm text-gray-400 mb-4">Solo puedes elegir 6 para que coincidan con los mejores perfiles.</p>
              
              <div className="space-y-6">
                {INTERESES_CATEGORIAS.map((cat, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{cat.nombre}</h4>
                    <div className="flex flex-wrap gap-2">
                      {cat.hobbies.map((hobby) => {
                        const isSelected = interests.includes(hobby)
                        return (
                          <button
                            key={hobby}
                            onClick={() => toggleInterest(hobby)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                                : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-pink-300'
                            }`}
                          >
                            {hobby}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-4 rounded-2xl font-extrabold text-lg transition-all shadow-lg ${
                saved
                  ? 'bg-green-500 text-white shadow-green-500/30'
                  : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-pink-500/30 hover:-translate-y-1 active:scale-[0.98]'
              }`}
            >
              {saved ? '¡Guardado con Éxito!' : 'Guardar y Ver Perfil'}
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="w-full py-3 text-gray-400 font-bold hover:text-gray-800 transition-colors"
            >
              Cancelar Cambios
            </button>

          </div>
        )}

      </div>
    </div>
  )
}

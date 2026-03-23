'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'

const allInterests = [
  'Deportes', 'Música', 'Cine', 'Lectura', 'Viajes', 'Cocinar',
  'Gaming', 'Fotografía', 'Gym', 'Fiestas', 'Arte', 'Café',
  'Netflix', 'Mascotas', 'Memes', 'Tecnología', 'Baile', 'Yoga',
]

export default function ProfilePage() {
  const { userProfile, updateProfile, matches, logout } = useApp()
  const router = useRouter()
  const [name, setName] = useState(userProfile.name)
  const [age, setAge] = useState(String(userProfile.age))
  const [career, setCareer] = useState(userProfile.career)
  const [semester, setSemester] = useState(String(userProfile.semester))
  const [bio, setBio] = useState(userProfile.bio)
  const [interests, setInterests] = useState<string[]>(userProfile.interests)
  const [saved, setSaved] = useState(false)

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 6
        ? [...prev, interest]
        : prev
    )
  }

  const handleSave = () => {
    updateProfile({
      name,
      age: parseInt(age) || 18,
      career,
      semester: parseInt(semester) || 1,
      bio,
      interests,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-center text-gray-800">Mi Perfil</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Profile photo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {name.charAt(0).toUpperCase()}
            </div>
            <button className="absolute bottom-0 right-0 w-9 h-9 bg-pink-500 rounded-full flex items-center justify-center shadow-md hover:bg-pink-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              {matches.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Matches</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              {interests.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Intereses</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              {semester}°
            </p>
            <p className="text-xs text-gray-500 mt-1">Semestre</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Información personal</h3>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Edad</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="17"
                  max="30"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Semestre</label>
                <input
                  type="number"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  min="1"
                  max="12"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Carrera</label>
              <input
                type="text"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Bio <span className="text-gray-400">({bio.length}/150)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={150}
                rows={3}
                placeholder="Cuéntanos algo sobre ti..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none resize-none transition-all"
              />
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-3">
              Intereses <span className="text-gray-400 font-normal normal-case">(máx. 6)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => {
                const isSelected = interests.includes(interest)
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md scale-105'
                        : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500'
                    }`}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-md ${
              saved
                ? 'bg-green-500 text-white scale-[0.98]'
                : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            {saved ? '¡Perfil guardado!' : 'Guardar cambios'}
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              logout()
              router.push('/login')
            }}
            className="w-full py-3 text-gray-400 font-medium text-sm hover:text-red-500 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

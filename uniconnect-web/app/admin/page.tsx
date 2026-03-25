'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { getReports, banUser, dismissReport } from '@/app/actions/report'
import { getAllUsers, toggleBanStatus, toggleAdminStatus, resetAllFeeds, toggleMinorStatus } from '@/app/actions/students'

interface Report {
  id: number;
  reason: string;
  status: string;
  created_at: string;
  reporter_name: string;
  reporter_id: number;
  reported_name: string;
  reported_id: number;
}

interface User {
  matricula: number;
  email: string;
  nombre: string;
  apellidos: string;
  carrera: string;
  semestre: number;
  edad: number;
  genero: string;
  is_admin: boolean;
  is_banned: boolean;
  es_menor: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { userProfile } = useApp()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Si no está cargando el profile y no es admin, kickear
    if (userProfile.matricula && !userProfile.is_admin) {
      router.push('/')
      return
    }

    if (userProfile.is_admin) {
      loadReports()
    }
  }, [userProfile, router])

  const loadReports = async () => {
    setLoading(true)
    const res = await getReports(userProfile.matricula!)
    if (res.success) {
      setReports(res.reports || [])
    } else {
      alert("Error al cargar reportes: " + res.error)
    }
    setLoading(false)
  }

  const loadUsers = async (query?: string) => {
    setLoading(true)
    try {
      const data = await getAllUsers(userProfile.matricula!, query)
      setUsers(data)
    } catch (err) {
      alert("Error cargando usuarios: " + err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userProfile.is_admin && activeTab === 'users') {
      loadUsers(searchQuery)
    }
  }, [activeTab, userProfile.is_admin])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(searchQuery)
  }

  const handleBan = async (reportId: number, reportedId: number) => {
    if (!confirm(`¿Estás seguro de BANEAR definitivamente a la matrícula ${reportedId}? Esta acción es irreversible.`)) return;
    const res = await banUser(userProfile.matricula!, reportedId);
    if (res.success) {
      alert("Usuario baneado exitosamente.");
      loadReports();
    } else {
      alert("Error al banear: " + res.error);
    }
  }

  const handleDismiss = async (reportId: number) => {
    const res = await dismissReport(userProfile.matricula!, reportId);
    if (res.success) {
      loadReports();
    } else {
      alert("Error: " + res.error);
    }
  }

  const handleToggleBan = async (targetId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'DESBANEAR' : 'BANEAR'
    if (!confirm(`¿Deseas ${action} a la matrícula ${targetId}?`)) return
    const res = await toggleBanStatus(userProfile.matricula!, targetId, !currentStatus)
    if (res.success) {
      loadUsers(searchQuery)
      loadReports()
    } else {
      alert("Error: " + res.error)
    }
  }

  const handleToggleAdmin = async (targetId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'QUITAR ADMIN' : 'HACER ADMIN'
    if (!confirm(`¿Deseas ${action} a la matrícula ${targetId}?`)) return
    const res = await toggleAdminStatus(userProfile.matricula!, targetId, !currentStatus)
    if (res.success) {
      loadUsers(searchQuery)
    } else {
      alert("Error: " + res.error)
    }
  }

  const handleToggleMinor = async (targetId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'QUERER PASAR A UNIVERSIDAD' : 'MARCAR COMO PREPA (MENOR)'
    if (!confirm(`¿Deseas cambiar el estado a '${action === 'QUERER PASAR A UNIVERSIDAD' ? 'Universidad' : 'Prepa'}'?`)) return
    const res = await toggleMinorStatus(userProfile.matricula!, targetId, !currentStatus)
    if (res.success) {
      loadUsers(searchQuery)
    } else {
      alert("Error: " + res.error)
    }
  }

  if (loading || !userProfile.is_admin) {
    return <div className="min-h-screen flex items-center justify-center p-10 font-sans text-xl">Cargando Panel de Admin...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Panel de Moderación</h1>
            <p className="text-gray-500 mt-2 font-medium">Gestiona los reportes de seguridad de UniConnect.</p>
          </div>
          <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
            Volver a la App
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'reports' ? 'bg-[#ba0034] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              Reportes {reports.length > 0 && `(${reports.filter(r => r.status === 'Pendiente').length})`}
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#ba0034] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              Usuarios
            </button>
          </div>

          <button 
            onClick={async () => {
              if (confirm('¡ATENCIÓN! ¿Estás seguro de reiniciar los feeds de TODOS los usuarios? Esto borrará los swipes no-match globalmente. Esta acción no se puede deshacer.')) {
                setLoading(true);
                const res = await resetAllFeeds(userProfile.matricula!);
                if (res.success) {
                  alert('¡Feeds de todos los usuarios reiniciados!');
                } else {
                  alert('Error: ' + res.error);
                }
                setLoading(false);
              }
            }}
            className="px-6 py-3 bg-white border border-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center gap-2"
          >
            <span>Reiniciar Todos los Feeds</span>
            <span className="text-lg">🔄</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Buscar por matrícula, nombre o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-[#ba0034] transition-all"
              />
              <button type="submit" className="px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors">
                Buscar
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'reports' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Reportado (Matrícula)</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Motivo</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Denunciante</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-gray-400 font-medium">No hay reportes pendientes. ¡El campus está seguro! 🎉</td>
                    </tr>
                  ) : (
                    reports.map(r => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-5 font-medium text-gray-500">#{r.id}</td>
                        <td className="p-5 font-bold text-gray-900">
                          {r.reported_name} <br/>
                          <span className="text-xs font-medium text-gray-400">{r.reported_id}</span>
                        </td>
                        <td className="p-5">
                          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-bold">
                            {r.reason}
                          </span>
                        </td>
                        <td className="p-5 text-gray-600 font-medium">{r.reporter_name} ({r.reporter_id})</td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-5 text-right flex items-center justify-end gap-2">
                          {r.status === 'Pendiente' && (
                            <>
                              <button 
                                onClick={() => handleBan(r.id, r.reported_id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-red-200"
                              >
                                Banear
                              </button>
                              <button 
                                onClick={() => handleDismiss(r.id)}
                                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold rounded-xl transition-colors shadow-sm"
                              >
                                Ignorar
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuario</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Matrícula</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Segregación</th>
                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.matricula} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-gray-900">{u.nombre} {u.apellidos}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="p-5 text-gray-600 font-mono text-sm">{u.matricula}</td>
                      <td className="p-5">
                        <div className="flex gap-1.5 flex-wrap">
                          {u.is_banned && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase">Baneado</span>}
                          {u.is_admin && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md uppercase">Admin</span>}
                          {!u.is_banned && !u.is_admin && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md uppercase">Activo</span>}
                        </div>
                      </td>
                      <td className="p-5">
                        <button 
                          onClick={() => handleToggleMinor(u.matricula, u.es_menor)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.es_menor ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {u.es_menor ? 'Prepa (Menor)' : 'Universidad'}
                        </button>
                      </td>
                      <td className="p-5 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleBan(u.matricula, u.is_banned)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.is_banned ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'}`}
                        >
                          {u.is_banned ? 'Desbanear' : 'Banear'}
                        </button>
                        <button 
                          onClick={() => handleToggleAdmin(u.matricula, u.is_admin)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.is_admin ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          {u.is_admin ? '- Admin' : '+ Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

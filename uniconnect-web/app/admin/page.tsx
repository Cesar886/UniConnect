'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { getReports, banUser, dismissReport } from '@/app/actions/report'

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

export default function AdminDashboard() {
  const { userProfile } = useApp()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

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

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
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
          </div>
        </div>
      </div>
    </div>
  )
}

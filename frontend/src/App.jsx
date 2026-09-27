import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import localforage from 'localforage'
import { Plus, FileText, RefreshCw, CheckCircle2, AlertCircle, Network } from 'lucide-react'
import GrafoBoveda from './GrafoBoveda'
import './App.css'

function App() {
  const [notas, setNotas] = useState([])
  const [notaActiva, setNotaActiva] = useState(null)
  const [estadoSync, setEstadoSync] = useState('sincronizado') // 'sincronizado', 'pendiente', 'sincronizando', 'error'
  const [vistaActiva, setVistaActiva] = useState('editor') // 'editor' o 'grafo'

  useEffect(() => {
    localforage.getItem('boveda_notas').then((guardadas) => {
      if (guardadas && guardadas.length > 0) {
        setNotas(guardadas)
        setNotaActiva(guardadas[0].id)
      }
    })

    const handleOnline = () => sincronizarConServidor();
    const handleOffline = () => setEstadoSync('error');
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (notas.length > 0) {
      localforage.setItem('boveda_notas', notas)
      setEstadoSync('pendiente')
    }
  }, [notas])

  const sincronizarConServidor = async () => {
    setEstadoSync('sincronizando')
    try {
      const notasLocales = await localforage.getItem('boveda_notas')
      if (!notasLocales || notasLocales.length === 0) return

      const respuesta = await fetch('http://localhost:8000/api/sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notasLocales)
      })

      if (respuesta.ok) {
        setEstadoSync('sincronizado')
      } else {
        setEstadoSync('error')
      }
    } catch (error) {
      setEstadoSync('error')
    }
  }

  const crearNota = () => {
    const nuevaNota = {
      id: Date.now().toString(),
      titulo: 'Sin título',
      contenido: ''
    }
    setNotas([nuevaNota, ...notas])
    setNotaActiva(nuevaNota.id)
    setVistaActiva('editor') // Volver al editor al crear una nota nueva
  }

  const actualizarNota = (texto) => {
    const lineas = texto.split('\n')
    const primerEncabezado = lineas.find(l => l.startsWith('# '))
    const posibleTitulo = primerEncabezado ? primerEncabezado.replace('# ', '') : 'Sin título'

    setNotas(notas.map(nota => 
      nota.id === notaActiva ? { ...nota, titulo: posibleTitulo, contenido: texto } : nota
    ))
  }

  const renderIconoSync = () => {
    switch(estadoSync) {
      case 'sincronizando': return <RefreshCw size={14} className="icon-spin text-blue" />;
      case 'sincronizado': return <CheckCircle2 size={14} className="text-green" />;
      case 'error': return <AlertCircle size={14} className="text-red" />;
      default: return <div className="dot-pending"></div>;
    }
  }

  const notaActual = notas.find(n => n.id === notaActiva) || { contenido: '' }

  return (
    <div className="app-container">
      {/* Barra Lateral */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-logo">B</span>
            <h2>Bóveda</h2>
          </div>
          <div className="sync-status" onClick={sincronizarConServidor} title="Forzar sincronización">
            {renderIconoSync()}
          </div>
        </div>

        <div className="sidebar-actions">
          <button className="btn-primary" onClick={crearNota} style={{ marginBottom: '10px' }}>
            <Plus size={16} /> Nueva Nota
          </button>
          <button 
            className="btn-primary" 
            onClick={() => setVistaActiva(vistaActiva === 'editor' ? 'grafo' : 'editor')} 
            style={{ background: '#232323', borderColor: '#4b4b4b' }}
          >
            <Network size={16} /> {vistaActiva === 'editor' ? 'Ver Grafo' : 'Ver Editor'}
          </button>
        </div>

        <div className="file-explorer">
          <span className="explorer-title">Tus Apuntes</span>
          <ul className="file-list">
            {notas.map(nota => (
              <li
                key={nota.id}
                className={`file-item ${nota.id === notaActiva ? 'active' : ''}`}
                onClick={() => {
                  setNotaActiva(nota.id)
                  setVistaActiva('editor') // Al hacer clic en un archivo, cambiamos a la vista editor
                }}
              >
                <FileText size={16} className="file-icon" />
                <span className="file-name">{nota.titulo}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Espacio de Trabajo Dinámico */}
      <main className="workspace">
        {vistaActiva === 'editor' ? (
          <>
            <div className="editor-pane">
              <div className="pane-header">EDITAR</div>
              <textarea
                value={notaActual.contenido}
                onChange={(e) => actualizarNota(e.target.value)}
                disabled={!notaActiva}
                placeholder="# Escribe un título aquí..."
                spellCheck="false"
              />
            </div>
            
            <div className="preview-pane">
              <div className="pane-header">VISTA PREVIA</div>
              <div className="markdown-content">
                {notaActual.contenido ? (
                  <ReactMarkdown>{notaActual.contenido}</ReactMarkdown>
                ) : (
                  <div className="empty-state">Comienza a escribir para ver la magia...</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <GrafoBoveda notas={notas} />
        )}
      </main>
    </div>
  )
}

export default App
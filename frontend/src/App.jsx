import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import localforage from 'localforage'
import './App.css'

function App() {
  const [notas, setNotas] = useState([])
  const [notaActiva, setNotaActiva] = useState(null)
  const [estadoSync, setEstadoSync] = useState('Sincronizado')

  // 1. Cargar notas al iniciar y configurar el detector de conexión
  useEffect(() => {
    localforage.getItem('boveda_notas').then((guardadas) => {
      if (guardadas && guardadas.length > 0) {
        setNotas(guardadas)
        setNotaActiva(guardadas[0].id)
      }
    })

    // Listener para sincronización automática al recuperar el internet
    window.addEventListener('online', sincronizarConServidor)
    window.addEventListener('offline', () => setEstadoSync('Modo Offline'))

    return () => {
      window.removeEventListener('online', sincronizarConServidor)
      window.removeEventListener('offline', () => setEstadoSync('Modo Offline'))
    }
  }, [])

  // 2. Persistir en IndexedDB en cada cambio
  useEffect(() => {
    if (notas.length > 0) {
      localforage.setItem('boveda_notas', notas)
      setEstadoSync('Cambios locales sin sincronizar')
    }
  }, [notas])

  // 3. Función para enviar los datos al backend FastAPI
  const sincronizarConServidor = async () => {
    setEstadoSync('Sincronizando...')
    try {
      // Leemos la fuente de la verdad local directamente
      const notasLocales = await localforage.getItem('boveda_notas')
      if (!notasLocales || notasLocales.length === 0) return

      const respuesta = await fetch('http://localhost:8000/api/sincronizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notasLocales)
      })

      if (respuesta.ok) {
        const resultado = await respuesta.json()
        console.log(resultado.mensaje)
        setEstadoSync('Sincronizado')
      } else {
        setEstadoSync('Error en el servidor')
      }
    } catch (error) {
      console.error('Fallo de red al intentar sincronizar:', error)
      setEstadoSync('Sin conexión al servidor')
    }
  }

  const crearNota = () => {
    const nuevaNota = {
      id: Date.now().toString(),
      titulo: 'Nueva Nota',
      contenido: '# Nueva Nota\n\nEmpieza a escribir...'
    }
    setNotas([nuevaNota, ...notas])
    setNotaActiva(nuevaNota.id)
  }

  const actualizarNota = (texto) => {
    const lineas = texto.split('\n')
    const posibleTitulo = lineas[0].startsWith('# ') ? lineas[0].replace('# ', '') : 'Sin título'

    const notasActualizadas = notas.map(nota => {
      if (nota.id === notaActiva) {
        return { ...nota, titulo: posibleTitulo, contenido: texto }
      }
      return nota
    })
    setNotas(notasActualizadas)
  }

  const notaActual = notas.find(n => n.id === notaActiva) || { contenido: '' }

  return (
    <div className="boveda-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <h3>Archivos Locales</h3>
            <span style={{fontSize: '10px', color: '#888'}}>{estadoSync}</span>
          </div>
          <button onClick={sincronizarConServidor} style={{marginRight: '5px', background: '#2ea44f'}}>Sync</button>
          <button onClick={crearNota}>+ Nueva</button>
        </div>
        <ul className="lista-notas">
          {notas.map(nota => (
            <li
              key={nota.id}
              className={nota.id === notaActiva ? 'activa' : ''}
              onClick={() => setNotaActiva(nota.id)}
            >
              {nota.titulo}
            </li>
          ))}
        </ul>
      </aside>

      <main className="workspace">
        <div className="editor-panel">
          <textarea
            value={notaActual.contenido}
            onChange={(e) => actualizarNota(e.target.value)}
            disabled={!notaActiva}
            placeholder="Crea una nota en la barra lateral para comenzar."
          />
        </div>
        <div className="preview-panel">
          <div className="markdown-preview">
            <ReactMarkdown>{notaActual.contenido}</ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
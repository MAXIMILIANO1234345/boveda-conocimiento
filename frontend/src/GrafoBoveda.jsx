import { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap 
} from 'reactflow';
import 'reactflow/dist/style.css';

export default function GrafoBoveda({ notas }) {
  // Transformamos tus notas en Nodos visuales para el grafo
  const nodos = useMemo(() => {
    return notas.map((nota, index) => ({
      id: nota.id,
      data: { label: nota.titulo || 'Sin título' },
      // Posición inicial básica (después le agregaremos físicas y auto-layout)
      position: { x: (index % 3) * 200, y: Math.floor(index / 3) * 100 },
      style: {
        background: '#1a1a1a',
        color: '#ededed',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '10px',
        width: 150,
      }
    }));
  }, [notas]);

  // Aquí irán las conexiones (Aristas/Edges) basadas en las etiquetas de la IA
  const aristas = [];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow 
        nodes={nodos} 
        edges={aristas}
        fitView
      >
        <Background color="#333" gap={16} />
        <Controls style={{ background: '#111', fill: '#fff' }} />
        <MiniMap nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.5)" style={{ background: '#161616' }} />
      </ReactFlow>
    </div>
  );
}
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from pydantic import BaseModel
from typing import List
import datetime

# ==========================================
# 1. Configuración de la Base de Datos (SQL)
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./boveda.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelo de la tabla en SQL
class NotaSQL(Base):
    __tablename__ = "notas"
    
    id = Column(String, primary_key=True, index=True)
    titulo = Column(String)
    contenido = Column(String)
    ultima_sincronizacion = Column(DateTime, default=datetime.datetime.utcnow)

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# Dependencia para abrir y cerrar la conexión a la base de datos en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. Esquemas de Datos (Pydantic)
# ==========================================
class NotaPydantic(BaseModel):
    id: str
    titulo: str
    contenido: str

# ==========================================
# 3. Lógica de la API (FastAPI)
# ==========================================
app = FastAPI(title="API Bóveda de Conocimiento")

# Configurar CORS para permitir que el Front-end de React (puerto 5173) se comunique con el Back-end
# Configurar CORS para permitir que el Front-end se comunique con el Back-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # El asterisco permite cualquier origen en desarrollo
    allow_credentials=False, # Obligatorio en False cuando se usa el asterisco
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/api/sincronizar")
def sincronizar_notas(notas: List[NotaPydantic], db: Session = Depends(get_db)):
    """
    Recibe el arreglo completo de notas desde la PWA (IndexedDB)
    y actualiza o inserta los registros en la base de datos SQL.
    """
    registros_actualizados = 0
    
    for nota_cliente in notas:
        # Buscar si la nota ya existe en SQL
        nota_db = db.query(NotaSQL).filter(NotaSQL.id == nota_cliente.id).first()
        
        if nota_db:
            # Actualizar nota existente
            nota_db.titulo = nota_cliente.titulo
            nota_db.contenido = nota_cliente.contenido
            nota_db.ultima_sincronizacion = datetime.datetime.utcnow()
        else:
            # Crear nueva nota
            nueva_nota = NotaSQL(
                id=nota_cliente.id,
                titulo=nota_cliente.titulo,
                contenido=nota_cliente.contenido
            )
            db.add(nueva_nota)
            
        registros_actualizados += 1
        
    db.commit()
    
    return {
        "estado": "éxito",
        "mensaje": f"Se sincronizaron {registros_actualizados} notas correctamente en SQL."
    }
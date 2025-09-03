"""
数据库管理模块
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_config

config = get_config()
database_url = config.get("database.url", "sqlite:///ztbai.db")

engine = create_engine(database_url, echo=config.get("database.echo", False))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """初始化数据库"""
    Base.metadata.create_all(bind=engine)

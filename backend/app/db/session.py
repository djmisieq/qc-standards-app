import logging
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# Import all models before creating tables
from app.db.base import *  # This imports all models and their relationships

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)


def init_db() -> None:
    # Create all tables
    logging.info("Creating database tables")
    SQLModel.metadata.create_all(engine)
    logging.info("Database tables created")
    
    # Initialize default data
    from app.db.init_data import init_data
    init_data()


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

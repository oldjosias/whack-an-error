"""Database Module for Whack-an-Error."""

import os
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


class GameData(Base):
    """Persisted aggregate data for a surface-code session."""

    __tablename__ = "game_data"

    uid = Column(String(32), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    name = Column(String(100))
    grid_size = Column(Integer, nullable=False)
    error_probabilities = Column(Text, nullable=False)
    probability_stats = Column(Text, nullable=False)


class DatabaseManager:
    """Manages database connection and operations"""
    
    def __init__(self):
        # Get database URL from environment (Render provides this)
        database_url = os.environ.get('DATABASE_URL')
        
        if not database_url:
            # Fallback to SQLite for local development
            database_url = 'sqlite:///whack_error.db'
            print("⚠️  No DATABASE_URL found, using SQLite locally")
        else:
            print(f"✅ Using database: {database_url.split('@')[0]}...")
        
        # Fix for Render's postgres:// vs postgresql:// URL
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        self.uid_max_length = 32
        try:
            self.engine = create_engine(database_url, echo=False)
            # Create all tables if they don't exist
            Base.metadata.create_all(self.engine)
            self._ensure_schema()
            print("✅ Database tables initialized")

            Session = sessionmaker(bind=self.engine)
            self.session = Session()
            self.uid_max_length = self._detect_uid_length()
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise
    
    def close(self):
        """Close database connection"""
        self.session.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def _ensure_schema(self) -> None:
        """Apply lightweight schema adjustments for backward compatibility."""

        inspector = inspect(self.engine)
        try:
            columns = {column["name"] for column in inspector.get_columns("game_data")}
        except Exception:
            return

        if "probability_stats" not in columns:
            try:
                with self.engine.begin() as connection:
                    connection.execute(
                        text("ALTER TABLE game_data ADD COLUMN probability_stats TEXT")
                    )
            except Exception:
                pass

    def _detect_uid_length(self) -> int:
        """Inspect the backing table to determine the stored UID length."""

        default_length = 32
        inspector = inspect(self.engine)
        try:
            columns = inspector.get_columns("game_data")
        except Exception:
            return default_length

        for column in columns:
            if column.get("name") != "uid":
                continue
            column_type = column.get("type")
            length = getattr(column_type, "length", None)
            if isinstance(length, int) and length > 0:
                return length
            break
        return default_length

        if self.engine.dialect.name == "postgresql":
            try:
                with self.engine.begin() as connection:
                    connection.execute(
                        text("ALTER TABLE game_data ALTER COLUMN uid TYPE VARCHAR(32)")
                    )
            except Exception:
                pass

"""Database Module for Whack-an-Error."""

import os
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


class GameData(Base):
    """Persisted aggregate data for a surface-code session."""

    __tablename__ = "game_data"

    uid = Column(String(36), primary_key=True)
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
        
        try:
            self.engine = create_engine(database_url, echo=False)
            # Create all tables if they don't exist
            Base.metadata.create_all(self.engine)
            print("✅ Database tables initialized")
            
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
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

"""
Database Module for Whack-an-Error
PostgreSQL storage using SQLAlchemy
"""
import os
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

Base = declarative_base()


class GameData(Base):
    """Game data model"""
    __tablename__ = 'game_data'
    
    uid = Column(String(8), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    name = Column(String(100))
    age = Column(Integer, nullable=True)
    grid_size = Column(Integer)
    error_probabilities = Column(Text)  # JSON string
    successful_rounds_per_level = Column(Text)  # JSON string
    rounds_per_level = Column(Integer)
    level_reached = Column(Integer)
    logical_errors = Column(Integer)


class DatabaseManager:
    """Manages database connection and operations"""
    
    def __init__(self):
        # Get database URL from environment (Render provides this)
        database_url = os.environ.get('DATABASE_URL')
        
        if not database_url:
            # Fallback to SQLite for local development
            database_url = 'sqlite:///whack_error.db'
        
        # Fix for Render's postgres:// vs postgresql:// URL
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        self.engine = create_engine(database_url)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    def close(self):
        """Close database connection"""
        self.session.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

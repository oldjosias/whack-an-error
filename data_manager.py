"""
Data Storage Module for Whack-an-Error
Handles database operations, highscores, and statistics
"""
import csv
import uuid
import datetime
import pandas as pd
import os
import json
from typing import Dict, List, Optional
from database import DatabaseManager, GameData


class DataManager:
    """Manages game data storage and retrieval using PostgreSQL"""
    
    def __init__(self, filename='data.csv'):
        # Keep filename parameter for backward compatibility, but use database
        self.use_database = os.environ.get('DATABASE_URL') is not None
        
        if self.use_database:
            print("📊 DataManager: Using PostgreSQL database")
            # Initialize database tables on first instantiation
            try:
                with DatabaseManager() as db:
                    print("✅ Database connection verified")
            except Exception as e:
                print(f"⚠️  Database initialization failed: {e}, falling back to CSV")
                self.use_database = False
        
        if not self.use_database:
            # Fallback to CSV for local development without database
            print("📊 DataManager: Using CSV storage")
            self.filename = filename
            self.headers = [
                'uid', 'timestamp', 'name', 'age', 'grid_size', 'error_probabilities',
                'successful_rounds_per_level', 'rounds_per_level', 'level_reached', 'logical_errors'
            ]
    
    def store_game_data(self, game_data: Dict) -> Dict:
        """Store game data to database or CSV file"""
        uid = str(uuid.uuid4())[:8]
        timestamp = datetime.datetime.now()
        
        if self.use_database:
            try:
                print(f"💾 Storing game data to database: uid={uid}")
                with DatabaseManager() as db:
                    game = GameData(
                        uid=uid,
                        timestamp=timestamp,
                        name=game_data.get('name', ''),
                        age=int(game_data.get('age')) if game_data.get('age') else None,
                        grid_size=int(game_data.get('grid_size', 0)),
                        error_probabilities=json.dumps(game_data.get('error_probabilities', [])),
                        successful_rounds_per_level=json.dumps(game_data.get('successful_rounds_per_level', [])),
                        rounds_per_level=int(game_data.get('rounds_per_level', 0)),
                        level_reached=int(game_data.get('level_reached', 0)),
                        logical_errors=int(game_data.get('logical_errors', 0))
                    )
                    db.session.add(game)
                    db.session.commit()
                    print(f"✅ Game data saved to database: {uid}")
                    
                return {'uid': uid, 'timestamp': timestamp.isoformat()}
            except Exception as e:
                print(f"❌ Database save failed: {e}")
                return {'error': str(e)}
        else:
            # CSV fallback for local development
            write_header = not self._file_exists()
            
            try:
                with open(self.filename, 'a', newline='') as f:
                    writer = csv.writer(f)
                    if write_header:
                        writer.writerow(self.headers)
                    
                    writer.writerow([
                        uid, timestamp.isoformat(),
                        game_data.get('name', ''),
                        game_data.get('age', ''),
                        game_data.get('grid_size', ''),
                        str(game_data.get('error_probabilities', [])),
                        str(game_data.get('successful_rounds_per_level', [])),
                        game_data.get('rounds_per_level', ''),
                        game_data.get('level_reached', ''),
                        game_data.get('logical_errors', '')
                    ])
                
                return {'filename': self.filename, 'uid': uid, 'timestamp': timestamp.isoformat()}
            except Exception as e:
                return {'error': str(e)}
    
    
    def get_highscores(self) -> Dict:
        """Get highscores by grid size"""
        highscores = {}
        
        if self.use_database:
            try:
                with DatabaseManager() as db:
                    from sqlalchemy import func
                    # Get max level for each grid size
                    results = db.session.query(
                        GameData.grid_size,
                        func.max(GameData.level_reached).label('max_level')
                    ).group_by(GameData.grid_size).all()
                    
                    for grid_size, max_level in results:
                        # Get name of player who achieved this level
                        player = db.session.query(GameData.name).filter(
                            GameData.grid_size == grid_size,
                            GameData.level_reached == max_level
                        ).first()
                        
                        highscores[str(grid_size)] = {
                            'level': max_level,
                            'name': player[0] if player and player[0] else ''
                        }
            except Exception:
                pass
        else:
            # CSV fallback
            try:
                with open(self.filename, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        grid_size = str(row.get('grid_size', ''))
                        try:
                            level = int(row.get('level_reached', 0))
                        except (ValueError, TypeError):
                            level = 0
                        
                        name = row.get('name', '')
                        
                        if grid_size not in highscores or level > highscores[grid_size]['level']:
                            highscores[grid_size] = {'level': level, 'name': name}
            except FileNotFoundError:
                pass
            except Exception:
                pass
        
        return highscores
    
    def get_statistics(self, age_min: Optional[int] = None, age_max: Optional[int] = None) -> Dict:
        """Get statistics grouped by grid size"""
        if self.use_database:
            try:
                with DatabaseManager() as db:
                    # Query all games, optionally filtered by age
                    query = db.session.query(GameData)
                    if age_min is not None:
                        query = query.filter(GameData.age >= age_min)
                    if age_max is not None:
                        query = query.filter(GameData.age <= age_max)
                    
                    games = query.all()
                    
                    # Convert to DataFrame for processing
                    data = []
                    for game in games:
                        data.append({
                            'grid_size': game.grid_size,
                            'error_probabilities': json.loads(game.error_probabilities),
                            'successful_rounds_per_level': json.loads(game.successful_rounds_per_level),
                            'rounds_per_level': game.rounds_per_level,
                            'level_reached': game.level_reached
                        })
                    
                    if not data:
                        return {}
                    
                    df = pd.DataFrame(data)
                    return self._calculate_statistics(df, group_by='grid_size')
            except Exception:
                return {}
        else:
            # CSV fallback
            try:
                df = pd.read_csv(self.filename)
                
                # Filter by age range if provided
                if age_min is not None:
                    df = df[df['age'].astype(str).apply(
                        lambda x: x.isdigit() and int(x) >= age_min
                    )]
                if age_max is not None:
                    df = df[df['age'].astype(str).apply(
                        lambda x: x.isdigit() and int(x) <= age_max
                    )]
                
                return self._calculate_statistics(df, group_by='grid_size')
                
            except Exception:
                return {}
    
    def get_statistics_by_age(self) -> Dict:
        """Get statistics grouped by age ranges"""
        age_ranges = [(0,7), (8,15), (16,25), (26,35), (36,45), (46,99)]
        
        if self.use_database:
            try:
                with DatabaseManager() as db:
                    result = {}
                    
                    for age_min, age_max in age_ranges:
                        # Query games in this age range
                        games = db.session.query(GameData).filter(
                            GameData.age >= age_min,
                            GameData.age <= age_max
                        ).all()
                        
                        if games:
                            # Convert to DataFrame
                            data = []
                            for game in games:
                                data.append({
                                    'grid_size': game.grid_size,
                                    'error_probabilities': json.loads(game.error_probabilities),
                                    'successful_rounds_per_level': json.loads(game.successful_rounds_per_level),
                                    'rounds_per_level': game.rounds_per_level,
                                    'level_reached': game.level_reached
                                })
                            
                            df = pd.DataFrame(data)
                            stats = self._calculate_statistics(df, group_by=None)
                            if stats:
                                result[f"{age_min}-{age_max}"] = stats
                    
                    # Handle unknown age
                    unknown_games = db.session.query(GameData).filter(
                        GameData.age.is_(None)
                    ).all()
                    
                    if unknown_games:
                        data = []
                        for game in unknown_games:
                            data.append({
                                'grid_size': game.grid_size,
                                'error_probabilities': json.loads(game.error_probabilities),
                                'successful_rounds_per_level': json.loads(game.successful_rounds_per_level),
                                'rounds_per_level': game.rounds_per_level,
                                'level_reached': game.level_reached
                            })
                        df = pd.DataFrame(data)
                        stats = self._calculate_statistics(df, group_by=None)
                        if stats:
                            result["unknown"] = stats
                    
                    return result
            except Exception:
                return {}
        else:
            # CSV fallback
            try:
                df = pd.read_csv(self.filename)
                result = {}
                
                for age_min, age_max in age_ranges:
                    filtered_df = df[df['age'].astype(str).apply(
                        lambda x: x.isdigit() and age_min <= int(x) <= age_max
                    )]
                    
                    if not filtered_df.empty:
                        stats = self._calculate_statistics(filtered_df, group_by=None)
                        if stats:
                            result[f"{age_min}-{age_max}"] = stats
                
                # Handle unknown age
                unknown_df = df[~df['age'].astype(str).apply(lambda x: x.isdigit())]
                if not unknown_df.empty:
                    stats = self._calculate_statistics(unknown_df, group_by=None)
                    if stats:
                        result["unknown"] = stats
                
                return result
            except Exception:
                return {}
    
    def _calculate_statistics(self, df: pd.DataFrame, group_by: Optional[str]) -> Dict:
        """Calculate error rate statistics from dataframe"""
        result = {}
        
        if group_by:
            groups = [(str(size), df[df[group_by] == size]) 
                     for size in sorted(df[group_by].unique(), key=lambda x: int(x))]
        else:
            groups = [('all', df)]
        
        for label, group in groups:
            try:
                # Define a consistent x-axis per group
                if group_by == 'grid_size':
                    d = int(label)
                    n = d * d + (d - 1) * (d - 1)
                else:
                    # Mixed grid sizes: choose the smallest n to ensure common support
                    n_values = []
                    for _, row in group.iterrows():
                        try:
                            d = int(row['grid_size'])
                            n_values.append(d * d + (d - 1) * (d - 1))
                        except Exception:
                            continue
                    if not n_values:
                        continue
                    n = min(n_values)

                max_idx = n // 2
                error_probs = [(i + 1) / n for i in range(max_idx)]
                agg_success = [0] * max_idx
                agg_total = [0] * max_idx

                for _, row in group.iterrows():
                    try:
                        success_row = eval(row['successful_rounds_per_level'])
                        rounds_row = (int(row['rounds_per_level']) 
                                      if 'rounds_per_level' in row and str(row['rounds_per_level']).isdigit() 
                                      else len(success_row))
                        try:
                            level_reached = int(row.get('level_reached', 0))
                        except Exception:
                            level_reached = 0

                        for i in range(min(len(success_row), max_idx)):
                            agg_success[i] += success_row[i]
                            if i < level_reached:
                                agg_total[i] += rounds_row
                    except Exception:
                        continue

                logical_error_rates = [
                    1 - (agg_success[i] / agg_total[i] if agg_total[i] > 0 else 0)
                    for i in range(max_idx)
                ]
                result[label] = {
                    'physical_error_rates': error_probs,
                    'logical_error_rates': logical_error_rates
                }
            except Exception:
                continue
        
        return result
    
    def _file_exists(self) -> bool:
        """Check if the data file exists"""
        try:
            with open(self.filename, 'r'):
                return True
        except FileNotFoundError:
            return False

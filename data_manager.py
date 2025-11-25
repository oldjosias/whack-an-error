"""
Data Storage Module for Whack-an-Error
Handles CSV operations, highscores, and statistics
"""
import csv
import uuid
import datetime
import pandas as pd
import os
from typing import Dict, List, Optional


class DataManager:
    """Manages game data storage and retrieval"""
    
    def __init__(self, filename='data.csv'):
        # Use persistent disk if available (Render), otherwise local directory
        data_dir = os.environ.get('DATA_DIR', '.')
        self.filename = os.path.join(data_dir, filename)
        self.headers = [
            'uid', 'timestamp', 'name', 'age', 'grid_size', 'error_probabilities',
            'successful_rounds_per_level', 'rounds_per_level', 'level_reached', 'logical_errors'
        ]
    
    def store_game_data(self, game_data: Dict) -> Dict:
        """Store game data to CSV file"""
        uid = str(uuid.uuid4())[:8]
        timestamp = datetime.datetime.now().isoformat()
        
        # Check if file exists and needs header
        write_header = not self._file_exists()
        
        try:
            with open(self.filename, 'a', newline='') as f:
                writer = csv.writer(f)
                if write_header:
                    writer.writerow(self.headers)
                
                writer.writerow([
                    uid, timestamp,
                    game_data.get('name', ''),
                    game_data.get('age', ''),
                    game_data.get('grid_size', ''),
                    str(game_data.get('error_probabilities', [])),
                    str(game_data.get('successful_rounds_per_level', [])),
                    game_data.get('rounds_per_level', ''),
                    game_data.get('level_reached', ''),
                    game_data.get('logical_errors', '')
                ])
            
            return {'filename': self.filename, 'uid': uid, 'timestamp': timestamp}
        except Exception as e:
            return {'error': str(e)}
    
    def get_highscores(self) -> Dict:
        """Get highscores by grid size"""
        highscores = {}
        
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
                        label = f"{age_min}-{age_max}"
                        # Take the first (and only) entry since we're not grouping
                        result[label] = list(stats.values())[0]

            # Unknown / missing age bucket
            unknown_df = df[df['age'].astype(str).apply(lambda x: not str(x).isdigit())]
            if not unknown_df.empty:
                stats = self._calculate_statistics(unknown_df, group_by=None)
                if stats:
                    result['unknown'] = list(stats.values())[0]
            
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

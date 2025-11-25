"""
Migration script to convert existing CSV data to PostgreSQL
Run this once after setting up the database
"""
import csv
import json
from database import DatabaseManager, GameData
from datetime import datetime


def migrate_csv_to_db(csv_file='data.csv'):
    """Migrate data from CSV to PostgreSQL"""
    print(f"Migrating data from {csv_file} to database...")
    
    try:
        with DatabaseManager() as db:
            with open(csv_file, 'r') as f:
                reader = csv.DictReader(f)
                count = 0
                
                for row in reader:
                    try:
                        # Parse age - handle empty/invalid values
                        age_val = row.get('age', '')
                        age = int(age_val) if age_val and age_val.isdigit() else None
                        
                        # Parse JSON fields
                        error_probs = row.get('error_probabilities', '[]')
                        successful_rounds = row.get('successful_rounds_per_level', '[]')
                        
                        game = GameData(
                            uid=row.get('uid', ''),
                            timestamp=datetime.fromisoformat(row.get('timestamp', datetime.now().isoformat())),
                            name=row.get('name', ''),
                            age=age,
                            grid_size=int(row.get('grid_size', 0)),
                            error_probabilities=error_probs if error_probs.startswith('[') else json.dumps(eval(error_probs)),
                            successful_rounds_per_level=successful_rounds if successful_rounds.startswith('[') else json.dumps(eval(successful_rounds)),
                            rounds_per_level=int(row.get('rounds_per_level', 0)),
                            level_reached=int(row.get('level_reached', 0)),
                            logical_errors=int(row.get('logical_errors', 0))
                        )
                        
                        db.session.add(game)
                        count += 1
                        
                        if count % 100 == 0:
                            print(f"Migrated {count} records...")
                            db.session.commit()
                    
                    except Exception as e:
                        print(f"Error migrating row: {e}")
                        continue
                
                db.session.commit()
                print(f"✅ Migration complete! Migrated {count} records.")
                
    except FileNotFoundError:
        print(f"❌ CSV file '{csv_file}' not found.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")


if __name__ == '__main__':
    migrate_csv_to_db()

from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

class Database:
    def __init__(self, database="project"):
        self.database = database
        self.connection = None
        self.cursor = None
        self.connect()
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host='localhost',
                database=self.database,
                user='root',
                password=''
            )
            self.cursor = self.connection.cursor()
            print(f"Connected to {self.database} database")
        except Error as e:
            print(f"Database connection error: {e}")
    
    def execute(self, query, params=None):
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            self.connection.commit()
            return self.cursor
        except Error as e:
            print(f"Database execute error: {e}")
            return None
    
    def fetchone(self):
        return self.cursor.fetchone()
    
    def fetchall(self):
        return self.cursor.fetchall()
    
    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()

def row_to_dict(row):
    """Convert database row to dictionary"""
    if hasattr(row, '_asdict'):
        return row._asdict()
    elif hasattr(row, 'keys'):
        return dict(row)
    else:
        # Fallback for simple tuple/list rows
        return {
            'id': row[0] if len(row) > 0 else None,
            'name': row[1] if len(row) > 1 else None,
            'contact_number': row[2] if len(row) > 2 else None,
        }

@app.route('/get_user_info', methods=['GET'])
def get_user_info():
    db = Database(database="project")
    
    username = request.args.get('username', '').strip()
    
    if not username:
        return jsonify({'success': False, 'message': 'Username is required'}), 400
    
    try:
        # Query the users table to get user information
        query = """
            SELECT 
                id,
                name,
                contact_number,
                role,
                aanganwaadi_id,
                gram,
                block,
                tehsil,
                zila,
                aanganwadi_code,
                created_at
            FROM users 
            WHERE contact_number = %s
        """
        
        result = db.execute(query, (username,))
        user = db.fetchone()
        
        if user:
            user = row_to_dict(user)
            return jsonify({
                'success': True,
                'user': user
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
            
    except Exception as e:
        print(f"[GET_USER_INFO ERROR] {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close()

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get application statistics for dashboard"""
    db = Database(database="project")
    
    try:
        # Count total families
        families_query = "SELECT COUNT(*) as total FROM families"
        db.execute(families_query)
        families_result = db.fetchone()
        total_families = families_result[0] if families_result else 0
        
        # Count total photo uploads (assuming there's a photos table or photos column)
        photos_query = "SELECT COUNT(*) as total FROM families WHERE photo_uploaded = 1"
        db.execute(photos_query)
        photos_result = db.fetchone()
        total_photos = photos_result[0] if photos_result else 0
        
        return jsonify({
            'success': True,
            'totalFamilies': total_families,
            'totalPhotos': total_photos,
            'distributedPlants': total_families,  # Assuming 1 plant per family
            'activeFamilies': total_families
        }), 200
        
    except Exception as e:
        print(f"[STATS ERROR] {e}")
        return jsonify({
            'success': False,
            'message': str(e),
            'totalFamilies': 25,  # Fallback data
            'totalPhotos': 18,
            'distributedPlants': 25,
            'activeFamilies': 25
        }), 500
    finally:
        db.close()

@app.route('/families/search', methods=['GET'])
def search_families():
    """Search families with optional center code filter"""
    db = Database(database="project")
    
    try:
        center_code = request.args.get('centerCode', '').strip()
        search_query = request.args.get('q', '').strip()
        
        # Base query
        if center_code:
            query = """
                SELECT 
                    id,
                    child_name as childName,
                    father_name as fatherName,
                    mother_name as motherName,
                    contact_number,
                    address,
                    aanganwaadi_id,
                    plant_distributed as plantDistributed,
                    photo_uploaded,
                    created_at
                FROM families 
                WHERE aanganwaadi_id = %s
            """
            params = (center_code,)
        else:
            query = """
                SELECT 
                    id,
                    child_name as childName,
                    father_name as fatherName,
                    mother_name as motherName,
                    contact_number,
                    address,
                    aanganwaadi_id,
                    plant_distributed as plantDistributed,
                    photo_uploaded,
                    created_at
                FROM families
            """
            params = ()
        
        # Add search filter if provided
        if search_query:
            if center_code:
                query += " AND (child_name LIKE %s OR father_name LIKE %s OR mother_name LIKE %s)"
                params = (center_code, f"%{search_query}%", f"%{search_query}%", f"%{search_query}%")
            else:
                query += " WHERE (child_name LIKE %s OR father_name LIKE %s OR mother_name LIKE %s)"
                params = (f"%{search_query}%", f"%{search_query}%", f"%{search_query}%")
        
        query += " ORDER BY created_at DESC LIMIT 50"
        
        db.execute(query, params)
        families = db.fetchall()
        
        # Convert to list of dictionaries
        families_list = []
        if families:
            for family in families:
                family_dict = row_to_dict(family)
                families_list.append(family_dict)
        
        return jsonify(families_list), 200
        
    except Exception as e:
        print(f"[FAMILIES_SEARCH ERROR] {e}")
        # Return empty list on error
        return jsonify([]), 500
    finally:
        db.close()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for connectivity testing"""
    return jsonify({'status': 'healthy', 'timestamp': time.time()}), 200

@app.route('/login', methods=['POST'])
def login():
    """Login endpoint for user authentication"""
    db = Database(database="project")
    
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password required'}), 400
        
        # Demo users for offline mode
        demo_users = {
            'admin': {'password': 'admin', 'name': 'Admin User', 'role': 'admin'},
            'student001': {'password': 'student001', 'name': 'Test Student 1', 'role': 'student'},
            'student002': {'password': 'student002', 'name': 'Test Student 2', 'role': 'student'}
        }
        
        # Check demo users first
        if username in demo_users and demo_users[username]['password'] == password:
            return jsonify({
                'success': True,
                'user': demo_users[username],
                'message': 'Demo login successful'
            }), 200
        
        # Query database for real users
        query = """
            SELECT 
                id, name, contact_number, role, aanganwaadi_id, gram
            FROM users 
            WHERE contact_number = %s AND password = %s
        """
        
        db.execute(query, (username, password))
        user = db.fetchone()
        
        if user:
            user_dict = {
                'id': user[0],
                'name': user[1],
                'contact_number': user[2],
                'role': user[3],
                'aanganwaadi_id': user[4],
                'gram': user[5]
            }
            return jsonify({
                'success': True,
                'user': user_dict,
                'message': 'Login successful'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
            
    except Exception as e:
        print(f"[LOGIN ERROR] {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
# Add this endpoint to your Flask server.py file

@app.route('/get_photo', methods=['POST'])
def get_photo():
    """
    POST API to fetch plant photo using mobile number and student name
    Teacher clicks camera button -> sends mobile and name -> gets photo URL
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400
        
        mobile = data.get('mobile')
        name = data.get('name')
        
        print(f"[GET_PHOTO] Received request for mobile: {mobile}, name: {name}")
        
        if not mobile or not name:
            return jsonify({"success": False, "message": "Mobile and name are required"}), 400
        
        db = Database(database=database_name)
        
        # Query to get plant photo for student with matching mobile and name
        query = """
            SELECT 
                id,
                name,
                mobile,
                plant_photo,
                totalImagesYet
            FROM students 
            WHERE mobile = %s AND name = %s
        """
        
        db.execute(query, (mobile, name))
        student_data = db.fetchone()
        
        if student_data:
            plant_photo = student_data.get('plant_photo')
            
            if plant_photo:
                # Build complete photo URL
                photo_url = f"http://165.22.208.62:5000/static/{plant_photo}"
                
                print(f"[GET_PHOTO] Photo found for {name}: {photo_url}")
                
                return jsonify({
                    "success": True,
                    "photo_url": photo_url,
                    "student_name": student_data.get('name'),
                    "mobile": student_data.get('mobile'),
                    "total_images": student_data.get('totalImagesYet', 0),
                    "message": "Photo retrieved successfully"
                }), 200
            else:
                print(f"[GET_PHOTO] No photo found for {name}")
                return jsonify({
                    "success": False,
                    "message": "No plant photo found for this student",
                    "student_name": student_data.get('name'),
                    "mobile": student_data.get('mobile')
                }), 404
        else:
            print(f"[GET_PHOTO] Student not found: mobile={mobile}, name={name}")
            return jsonify({
                "success": False,
                "message": "Student not found with provided mobile and name"
            }), 404
            
    except mysql.connector.Error as db_err:
        print(f"[GET_PHOTO DB ERROR] {db_err}")
        return jsonify({
            'success': False, 
            'message': f'Database error: {db_err}'
        }), 500
    except Exception as e:
        print(f"[GET_PHOTO ERROR] {e}")
        return jsonify({
            'success': False, 
            'message': f'Internal server error: {e}'
        }), 500
    finally:
        db.close()

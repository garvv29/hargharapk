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
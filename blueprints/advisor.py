from functions import get_db_connection, role_required
from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user

advisor_bp = Blueprint('advisor', __name__, template_folder='templates')

# Apply the decorator to the route
@advisor_bp.route('/api/student_info', methods=['GET'])
@login_required
@role_required('advisor', 'admin')
def get_student_info():
    username = request.args.get('username')
    
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    
    # Get user info
    cursor.execute('SELECT * FROM User WHERE username = %s', (username,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user_id = user['userID']
    
    # Get courses and grades
    cursor.execute('''
        SELECT * FROM CoursesTaken WHERE userID = %s
    ''', (user_id,))
    courses_taken = cursor.fetchall()
    
    # Get degree plans
    cursor.execute('SELECT * FROM schedules WHERE user_id = %s', (user_id,))
    degree_plans = cursor.fetchall()
    
    connection.close()
    
    return jsonify({
        "user": user['username'],
        "courses_taken": courses_taken,
        "degree_plans": degree_plans
    })

# Apply the decorator to the route
@advisor_bp.route('/advisor_portal', methods=['GET'])
@login_required
@role_required('advisor', 'admin')
def advisor_portal():
    return render_template('advisor_portal.html')
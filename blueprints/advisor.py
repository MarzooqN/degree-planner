from functions import get_db_connection, role_required
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

advisor_bp = Blueprint('select_degree', __name__, template_folder='templates')

# Apply the decorator to the route
@advisor_bp.route('/api/student_info', methods=['GET'])
@login_required
@role_required('advisor', 'admin')
def get_student_info():
    username = request.args.get('username')
    
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    
    # Get user info
    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user_id = user['id']
    
    # Get courses and grades
    cursor.execute('''
        SELECT c.course_id, c.course_name, g.grade
        FROM grades g
        JOIN courses c ON g.course_id = c.id
        WHERE g.user_id = %s
    ''', (user_id,))
    courses_grades = cursor.fetchall()
    
    # Get degree plans
    cursor.execute('SELECT * FROM degree_plans WHERE user_id = %s', (user_id,))
    degree_plans = cursor.fetchall()
    
    connection.close()
    
    return jsonify({
        "user": user,
        "courses_grades": courses_grades,
        "degree_plans": degree_plans
    })
from functions import get_db_connection
from flask import jsonify, request, render_template, redirect, url_for, Blueprint
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

login_bp = Blueprint('login', __name__, template_folder='templates')
courses_selected = []


#Function to check if username exists in the database
def username_exists(username):
    connection = get_db_connection('users')
    cursor = connection.cursor()
    cursor.execute('SELECT username FROM User WHERE username = %s', (username,))
    existing_user = cursor.fetchone()
    cursor.close()
    connection.close()
    return existing_user is not None

#Route to check if the username is available
@login_bp.route('/check_username', methods=['POST'])
def check_username():
    data = request.json
    username = data.get('username')
    if username_exists(username):
        return jsonify({'available': False})
    else:
        return jsonify({'available': True})

#Route for registering user into database
@login_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = generate_password_hash(data.get('password'))
        
        if username_exists(username):
            return jsonify({'success': False, 'message': 'Username already exists'})

        connection = get_db_connection('users')
        cursor = connection.cursor()
        cursor.execute('INSERT INTO User (username, password) VALUES (%s, %s)', (username, password))
        connection.commit()
        cursor.close()
        connection.close()
        return jsonify({'success': True})
        
    return render_template('register.html')


#Route for logging out
@login_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


#Route for getting all completed courses by the user
@login_bp.route('/api/completed_courses', methods=['GET'])
@login_required
def get_completed_courses():
    user = current_user.id
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute(f'''
        SELECT c.courseID, c.semester, c.year FROM CoursesTaken c WHERE userID= {user}
    ''')
    courses = cursor.fetchall()
    connection.close()


    return jsonify(courses)
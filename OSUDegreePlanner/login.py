from OSUDegreePlanner import app
from functions import get_db_connection
from flask import jsonify, request, render_template, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash


login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
courses_selected = []

#Class for User
class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

#Loading in the user/creating user object from database
@login_manager.user_loader
def load_user(user_id):
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT * FROM User WHERE userID = %s', (user_id,))
    user_data = cursor.fetchone()
    cursor.close()
    connection.close()
    if user_data:
        return User(id = user_data['userID'], username=user_data['username'], password=user_data['password'])
    return None

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
@app.route('/check_username', methods=['POST'])
def check_username():
    data = request.json
    username = data.get('username')
    if username_exists(username):
        return jsonify({'available': False})
    else:
        return jsonify({'available': True})

#Route for registering user into database
@app.route('/register', methods=['GET', 'POST'])
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


#Route for logging in user
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        connection = get_db_connection('users')
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT * FROM User WHERE username = %s', (username,))
        user_data = cursor.fetchone()
        cursor.close()
        connection.close()

        if user_data and check_password_hash(user_data['password'], password):
            user = User(id=user_data['userID'], username=user_data['username'], password=user_data['password'])
            login_user(user)
            return redirect(url_for('select_major'))
        else:
            return render_template('register.html')
        
    return render_template('login.html')


#Route for logging out
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


#Route for getting all completed courses by the user
@app.route('/api/completed_courses', methods=['GET'])
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
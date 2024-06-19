from flask import Flask, jsonify, request, render_template, redirect, url_for, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'abc123'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Class for User
class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

# Loading in the user/creating user object from database
@login_manager.user_loader
def load_user(user_id):
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT * FROM User WHERE userID = %s', (user_id,))
    user_data = cursor.fetchone()
    cursor.close()
    connection.close()
    if user_data:
        return User(id=user_data['userID'], username=user_data['username'], password=user_data['password'])
    return None

# Database connection function 
def get_db_connection(database):
    connection = mysql.connector.connect(
        host="34.162.95.182",
        database=database,
        user="root",
        password="OSUDEGREEPLAN!"
    )
    return connection

# Initialize session for selected courses
def initialize_session():
    if 'selected_courses' not in session:
        session['selected_courses'] = []

@app.before_request
def before_request():
    initialize_session()

# Route for registering user into database
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])
        connection = get_db_connection('users')
        cursor = connection.cursor()
        cursor.execute('INSERT INTO User (username, password) VALUES (%s, %s)', (username, password))
        connection.commit()
        cursor.close()
        connection.close()
        return redirect(url_for('login'))
    return render_template('register.html')

# Route for logging in user
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
            return 'Invalid credentials'
        
    return render_template('login.html')

# Route for logging out
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# Route for when they select only major
@app.route('/select_major', methods=['GET', 'POST'])
@login_required
def select_major():
    if request.method == 'POST':
        college = request.form['college']
        major = request.form['major']
        program = request.form['program']
        session['degree'] = f'{college}_{major}_{program}'
        session['schedule_id'] = 0

        user_id = current_user.id
        connection = get_db_connection('users')
        cursor = connection.cursor(dictionary=True)

        # Clear selected courses from session
        session['selected_courses'] = []

        connection.close()

        return redirect(url_for('index'))
    return render_template('select_major.html')

# Route for getting degree (probably should name it something else)
@app.route('/load_schedule/<int:schedule_id>', methods=['GET'])
@login_required
def load_schedule(schedule_id):
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT degree FROM schedules WHERE schedule_id = %s AND user_id = %s', (schedule_id, current_user.id))
    schedule = cursor.fetchone()
    cursor.close()
    connection.close()

    if schedule:
        session['schedule_id'] = schedule_id
        session['degree'] = schedule['degree']
        return redirect(url_for('index'))
    else:
        return 'Schedule not found', 404

# Route for getting courses and their prerequisites 
@app.route('/api/courses', methods=['GET'])
@login_required
def get_courses():
    connection = get_db_connection('Courses')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT c.CourseID, c.CourseName, c.Credits, p.RequirementID, p.PrerequisiteGroup, p.Type
        FROM Courses c
        LEFT JOIN Prerequisites p ON c.CourseID = p.CourseID
    ''')
    courses = cursor.fetchall()
    connection.close()

    course_dict = {}
    for row in courses:
        course_id = row['CourseID']
        if course_id not in course_dict:
            course_dict[course_id] = {
                'CourseID': course_id,
                'CourseName': row['CourseName'],
                'Credits': row['Credits'],
                'prerequisites': []
            }
        if row['RequirementID']:
            course_dict[course_id]['prerequisites'].append({
                'prerequisiteID': row['RequirementID'],
                'group': row['PrerequisiteGroup'],
                'type': row['Type']
            })

    return jsonify(list(course_dict.values()))

# Route for getting degree requirements 
@app.route('/api/requirements', methods=['GET'])
@login_required
def get_requirements():
    degree = session.get('degree')
    connection = get_db_connection(degree)
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT r.RequirementName, r.RequirementType, r.RequiredCredits, r.CoursePrefix, r.MinCourseNumber, r.MaxCourseNumber, rc.CourseID, c.CourseName, rc.Credits, rc.CourseGroup
        FROM Requirements r
        LEFT JOIN RequirementCourses rc ON r.RequirementID = rc.RequirementID
        LEFT JOIN Courses.Courses c ON rc.CourseID = c.CourseID
        ORDER BY r.RequirementName
    ''')
    requirements = {}
    for row in cursor:
        req_name = row['RequirementName']
        if req_name not in requirements:
            requirements[req_name] = {
                'type': row['RequirementType'],
                'required_credits': row['RequiredCredits'],
                'course_prefix': row['CoursePrefix'],
                'min_course_number': row['MinCourseNumber'],
                'max_course_number': row['MaxCourseNumber'],
                'groups': {}
            }
        if row['RequirementType'] == 'some_courses':
            group = row['CourseGroup']
            if group not in requirements[req_name]['groups']:
                requirements[req_name]['groups'][group] = []
            requirements[req_name]['groups'][group].append({
                'CourseID': row['CourseID'],
                'CourseName': row['CourseName'],
                'Credits': row['Credits']
            })
        else:
            if 'courses' not in requirements[req_name]:
                requirements[req_name]['courses'] = []
            requirements[req_name]['courses'].append({
                'CourseID': row['CourseID'],
                'CourseName': row['CourseName'],
                'Credits': row['Credits']
            })
    connection.close()
    return jsonify(requirements)

# Route for getting courses between a certain range
@app.route('/api/courses_in_range', methods=['GET'])
@login_required
def get_courses_in_range():
    prefix = request.args.get('prefix')
    min_number = int(request.args.get('min'))
    max_number = int(request.args.get('max'))
    connection = get_db_connection('Courses')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT CourseID, CourseName, Credits
        FROM Courses
        WHERE CourseID LIKE %s AND CAST(SUBSTR(CourseID, LENGTH(%s) + 1) AS UNSIGNED) BETWEEN %s AND %s
    ''', (f"{prefix}%", prefix, min_number, max_number))
    courses = cursor.fetchall()
    connection.close()
    return jsonify(courses)

# Route for getting selected course from session storage
@app.route('/api/selected_course', methods=['POST', 'GET'])
@login_required
def get_selected_course():
    data = request.json
    course_box_id = data.get('course_box_id')
    user = current_user.id

    selected_courses = session.get('selected_courses', [])
    selected_course = [course for course in selected_courses if course['courseBoxID'] == course_box_id]

    return jsonify(selected_course)

# Route for getting all completed courses by the user
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

# Route for adding courses to the selected courses list
@app.route('/api/add_course', methods=['POST'])
@login_required
def add_course():
    data = request.json
    course_box_id = data.get('course_box_id')
    requirement_name = data.get('requirement_name')
    requirement_type = data.get('requirement_type')
    course_id = data.get('course_id')
    course_name = data.get('course_name')
    credits = data.get('credits')
    selected = data.get('selected')

    selected_courses = session.get('selected_courses', [])
    selected_courses.append({
        'courseBoxID': course_box_id,
        'requirementName': requirement_name,
        'requirementType': requirement_type,
        'courseID': course_id,
        'courseName': course_name,
        'credits': credits,
        'selected': selected
    })
    session['selected_courses'] = selected_courses

    return jsonify(selected_courses)

# Route for removing a course from the selected courses list
@app.route('/api/remove_course', methods=['POST'])
@login_required
def remove_course():
    data = request.json
    course_box_id = data.get('course_box_id')

    selected_courses = session.get('selected_courses', [])
    selected_courses = [course for course in selected_courses if course['courseBoxID'] != course_box_id]
    session['selected_courses'] = selected_courses

    return jsonify(selected_courses)

# Run the application
if __name__ == '__main__':
    app.run(debug=True)

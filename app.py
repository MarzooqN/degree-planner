from flask import Flask, jsonify, request, render_template, redirect, url_for, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'abc123'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'


class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

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

def get_db_connection(database):
    connection = mysql.connector.connect(
        host="34.162.95.182",
        database=database,
        user="root",
        password="OSUDEGREEPLAN!"
    )
    return connection

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


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/select_major', methods=['GET', 'POST'])
@login_required
def select_major():
    if request.method == 'POST':
        major = request.form['major']
        session['major'] = major
        session['schedule_id'] = 0
        return redirect(url_for('index'))
    return render_template('select_major.html')

@app.route('/load_schedule/<int:schedule_id>', methods=['GET'])
@login_required
def load_schedule(schedule_id):
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT major FROM schedules WHERE schedule_id = %s AND user_id = %s', (schedule_id, current_user.id))
    schedule = cursor.fetchone()
    cursor.close()
    connection.close()

    if schedule:
        session['schedule_id'] = schedule_id
        session['major'] = schedule['major']
        return redirect(url_for('index'))
    else:
        return 'Schedule not found', 404
    

@app.route('/api/courses', methods=['GET'])
@login_required
def get_courses():
    major = session.get('major')
    connection = get_db_connection(major)
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT c.CourseID, c.CourseName, c.Credits, p.RequirementID, p.PrerequisiteGroup, p.Type
        FROM courses c
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

@app.route('/api/requirements', methods=['GET'])
@login_required
def get_requirements():
    major = session.get('major')
    connection = get_db_connection(major)
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT r.RequirementName, rc.CourseID, c.CourseName
        FROM Requirements r
        JOIN RequirementCourses rc ON r.RequirementID = rc.RequirementID
        JOIN courses c ON rc.CourseID = c.CourseID
        ORDER BY r.RequirementName
    ''')
    requirements = {}
    for row in cursor:
        req_name = row['RequirementName']
        if req_name not in requirements:
            requirements[req_name] = []
        requirements[req_name].append({'CourseID': row['CourseID'], 'CourseName': row['CourseName']})
    connection.close()
    return jsonify(requirements)

@app.route('/api/selected_course', methods=['POST', 'GET'])
@login_required
def get_selected_course():
    data = request.json
    course_box_id = data.get('course_box_id')
    user = current_user.id

    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT c.courseID, c.credits FROM CoursesSelected c WHERE userID=%s AND courseBoxID=%s
                   ''', (user, course_box_id))
    course = cursor.fetchall()
    cursor.close()
    
    return jsonify(course)

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

@app.route('/api/add_course', methods=['POST'])
@login_required
def add_course():
    data = request.json
    course_box_id = data.get('course_box_id')
    user_id = current_user.id
    course_id = data.get('course_id')
    semester = data.get('semester')
    year = data.get('year')
    credits = data.get('credits')

    try:
        connection = get_db_connection('users')
    except:
        return jsonify({"error": "Failed connecting to database"}), 404
    
    cursor = connection.cursor()
    try:
        cursor.execute('''
            INSERT INTO CoursesSelected (courseBoxID, userID, courseID, semester, year, credits)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (course_box_id, user_id, course_id, semester, year, credits))
        connection.commit()
    except:
        return jsonify({"error": "Failed to commit to database"}), 404
    
    connection.close()

    return jsonify({"success": True}), 201
    
@app.route('/api/remove_course', methods=['POST'])
@login_required
def remove_course():
    data = request.json
    user_id = current_user.id
    course_box_id = data.get('course_box_id')

    connection = get_db_connection('users')
    cursor = connection.cursor()
    try:
        cursor.execute('''
            DELETE FROM CoursesSelected WHERE courseBoxID=%s AND userID=%s
        ''', (course_box_id, user_id))
        connection.commit()
    except:
        return jsonify({"error": "Something went wrong"}), 404
    
    return jsonify({"success": True}), 201


@app.route('/api/save_schedule', methods=['POST'])
@login_required
def save_schedule():
    data = request.json
    schedule_name = data.get('schedule_name')
    major = session.get('major')
    user_id = current_user.id

    connection = get_db_connection('users')
    cursor = connection.cursor()
    try:
        cursor.execute('''
            INSERT INTO schedules (user_id, schedule_name, major)
            VALUES (%s, %s, %s)
        ''', (user_id, schedule_name, major))
        schedule_id = cursor.lastrowid

        for course in data.get('courses'):
            cursor.execute('''
                INSERT INTO schedule_courses (schedule_id, course_id, semester, year)
                VALUES (%s, %s, %s, %s)
            ''', (schedule_id, course['course_id'], course['semester'], course['year']))

        connection.commit()
    except:
        return jsonify({"error": "Failed to save schedule"}), 404
    
    connection.close()
    return jsonify({"success": True}), 201

@app.route('/api/get_schedules', methods=['GET'])
@login_required
def get_schedules():
    user_id = current_user.id
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT s.schedule_id, s.schedule_name, s.major, sc.course_id, sc.semester, sc.year
        FROM schedules s
        JOIN schedule_courses sc ON s.schedule_id = sc.schedule_id
        WHERE s.user_id = %s
    ''', (user_id,))
    schedules = cursor.fetchall()
    connection.close()

    schedules_dict = {}
    for row in schedules:
        if row['schedule_id'] not in schedules_dict:
            schedules_dict[row['schedule_id']] = {
                'schedule_name': row['schedule_name'],
                'major': row['major'],
                'courses': []
            }
        schedules_dict[row['schedule_id']]['courses'].append({
            'course_id': row['course_id'],
            'semester': row['semester'],
            'year': row['year']
        })

    return jsonify(schedules_dict)


@app.route('/api/get_schedule/<int:schedule_id>', methods=['GET'])
@login_required
def get_schedule(schedule_id):
    user_id = current_user.id
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)

    cursor.execute('''
        DELETE FROM users.CoursesSelected WHERE userID = %s;
    ''', (user_id,))
    connection.commit()

    cursor.execute('''
        SELECT s.schedule_id, s.schedule_name, s.major, sc.course_id, sc.semester, sc.year
        FROM schedules s
        JOIN schedule_courses sc ON s.schedule_id = sc.schedule_id
        WHERE s.schedule_id = %s AND s.user_id = %s
    ''', (schedule_id, user_id))
    schedule = cursor.fetchall()
    connection.close()

    if not schedule:
        return jsonify({"error": "Schedule not found"}), 404

    schedule_data = {
        'schedule_id': schedule_id,
        'schedule_name': schedule[0]['schedule_name'],
        'major': schedule[0]['major'],
        'courses': [
            {
                'course_id': row['course_id'],
                'semester': row['semester'],
                'year': row['year']
            } for row in schedule
        ]
    }

    return jsonify(schedule_data)

@app.route('/api/delete_schedule/<int:schedule_id>', methods=['GET'])
@login_required
def delete_schedule(schedule_id):
    user_id = current_user.id
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)

    cursor.execute('''
        DELETE FROM schedule_courses WHERE schedule_id = %s
    ''', (schedule_id,))
    connection.commit()

    cursor.execute('''
        DELETE FROM schedules WHERE user_id = %s AND schedule_id = %s
    ''', (user_id, schedule_id))
    connection.commit()
    
    connection.close()
    return render_template('select_major.html')

@app.route('/api/update_schedule/<int:schedule_id>', methods=['POST'])
@login_required
def update_schedule(schedule_id):
    data = request.json

    connection = get_db_connection('users')
    cursor = connection.cursor()

    try:
        # Delete existing courses for the schedule
        cursor.execute('''
            DELETE FROM schedule_courses WHERE schedule_id = %s
        ''', (schedule_id,))

        # Insert new courses for the schedule
        for course in data['courses']:
            cursor.execute('''
                INSERT INTO schedule_courses (schedule_id, course_id, semester, year)
                VALUES (%s, %s, %s, %s)
            ''', (schedule_id, course['course_id'], course['semester'], course['year']))

        connection.commit()
    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to update schedule"}), 404
    
    connection.close()
    return jsonify({"success": True}), 200





@app.route('/', methods=['POST', 'GET'])
@login_required
def index():
    schedule_id = session.get('schedule_id')
    print(schedule_id)
    return render_template('index.html', schedule_id=schedule_id)


if __name__ == '__main__':
    app.run(debug=True)


 
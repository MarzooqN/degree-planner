from flask import Flask, jsonify, request, render_template, redirect, url_for, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'abc123'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

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

#Database connection function 
def get_db_connection(database):
    connection = mysql.connector.connect(
        host="34.162.95.182",
        database=database,
        user="root",
        password="OSUDEGREEPLAN!"
    )
    return connection

#Route for registering user into database
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
            return 'Invalid credentials'
        
    return render_template('login.html')


#Route for logging out
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


#Route for when they select only major
@app.route('/select_major', methods=['GET', 'POST'])
@login_required
def select_major():
    if request.method == 'POST':
        major = request.form['major']
        session['major'] = major
        session['schedule_id'] = 0

        user_id = current_user.id
        connection = get_db_connection('users')
        cursor = connection.cursor(dictionary=True)

        cursor.execute('''
            DELETE FROM users.CoursesSelected WHERE userID = %s;
        ''', (user_id,))
        connection.commit()
        connection.close()

        return redirect(url_for('index'))
    return render_template('select_major.html')

#Route for getting major (probably should name it something else)
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
    

#Route for getting courses and their prerequisties 
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


#Route for getting degree requirements 
@app.route('/api/requirements', methods=['GET'])
@login_required
def get_requirements():
    major = session.get('major')
    connection = get_db_connection(major)
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT r.RequirementName, r.RequirementType, r.RequiredCredits, r.CoursePrefix, r.MinCourseNumber, r.MaxCourseNumber, rc.CourseID, c.CourseName, rc.Credits, rc.CourseGroup
        FROM Requirements r
        LEFT JOIN RequirementCourses rc ON r.RequirementID = rc.RequirementID
        LEFT JOIN courses c ON rc.CourseID = c.CourseID
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


#Route for getting courses between a certain range
@app.route('/api/courses_in_range', methods=['GET'])
@login_required
def get_courses_in_range():
    prefix = request.args.get('prefix')
    min_number = int(request.args.get('min'))
    max_number = int(request.args.get('max'))
    connection = get_db_connection(prefix)
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT CourseID, CourseName, Credits
        FROM courses
        WHERE CourseID LIKE %s AND CAST(SUBSTR(CourseID, LENGTH(%s) + 1) AS UNSIGNED) BETWEEN %s AND %s
    ''', (f"{prefix}%", prefix, min_number, max_number))
    courses = cursor.fetchall()
    connection.close()
    return jsonify(courses)


#Route for getting course from selected courses database (probably doesnt need to be inputted into database)
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

#Route for adding a coure into selected courses table
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

#Route for removing course from selected courses table
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


#Route for saving schdule 
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


#Route for getting all the schedules and their courses (could improve logic)
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



#Route for getting specifc schedule
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


#Route for deleting schedule
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


#Route for updating a schedule
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


#Main route/page
@app.route('/', methods=['POST', 'GET'])
@login_required
def index():
    schedule_id = session.get('schedule_id')
    print(schedule_id)
    return render_template('index.html', schedule_id=schedule_id)


#Route for removing all courses from row
@app.route('/api/remove_all_courses', methods=['POST'])
@login_required
def remove_all_courses():
    data = request.json
    user_id = current_user.id
    semester = data.get('semester')
    year = data.get('year')

    if not user_id or not semester or not year:
        return jsonify({'error': 'Missing required parameters'}), 400

    connection = get_db_connection('users')
    cursor = connection.cursor()

    try:
        cursor.execute('''
            DELETE FROM CoursesSelected WHERE userID = %s AND semester = %s AND year = %s
        ''', (user_id, semester, year))
        connection.commit()
    except Exception as e:
        print(e)
        return jsonify({'error': f'Failed to remove courses: {e}'}), 500
    finally:
        cursor.close()
        connection.close()

    return jsonify({'success': 'Courses removed successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True)


 

from functions import get_db_connection
from flask import jsonify, request, render_template, redirect, url_for, session, Blueprint
from flask_login import login_required, current_user

schedule_bp = Blueprint('schedule', __name__, template_folder='templates')

#Route for getting degree (probably should name it something else)
@schedule_bp.route('/load_schedule/<int:schedule_id>', methods=['GET'])
@login_required
def load_schedule(schedule_id):
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT degree, prof FROM schedules WHERE schedule_id = %s AND user_id = %s', (schedule_id, current_user.id))
    schedule = cursor.fetchone()
    cursor.close()
    connection.close()

    if schedule:
        session['schedule_id'] = schedule_id
        session['degree'] = schedule['degree']
        session['prof'] = schedule['prof']
        courses_selected = []
        session['major_name'] = "None"
        return redirect(url_for('courses.planner'))
    else:
        return 'Schedule not found', 404
    
#Route for saving schdule 
@schedule_bp.route('/api/save_schedule', methods=['POST'])
@login_required
def save_schedule():
    data = request.json
    schedule_name = data.get('schedule_name')
    degree = session.get('degree')
    prof = session.get('prof')
    user_id = current_user.id

    connection = get_db_connection('users')
    cursor = connection.cursor()
    try:
        cursor.execute('''
            INSERT INTO schedules (user_id, schedule_name, degree, prof)
            VALUES (%s, %s, %s, %s)
        ''', (user_id, schedule_name, degree, prof))
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
@schedule_bp.route('/api/get_schedules', methods=['GET'])
@login_required
def get_schedules():
    user_id = current_user.id
    connection = get_db_connection('users')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT s.schedule_id, s.schedule_name, s.degree, s.prof, sc.course_id, sc.semester, sc.year
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
                'degree': row['degree'],
                'prof': row['prof'],
                'courses': []
            }
        
        schedules_dict[row['schedule_id']]['courses'].append({
            'course_id': row['course_id'],
            'semester': row['semester'],
            'year': row['year']
        })

        session[f'schedule {row['schedule_id']}'] = schedules_dict[row['schedule_id']]

    return jsonify(schedules_dict)



#Route for getting specifc schedule
@schedule_bp.route('/api/get_schedule/<int:schedule_id>', methods=['GET'])
@login_required
def get_schedule(schedule_id):

    schedule = session.get(f'schedule {schedule_id}')

    if not schedule:
        return jsonify({"error": "Schedule not found"}), 404

    schedule_data = {
        'schedule_id': schedule_id,
        'schedule_name': schedule['schedule_name'],
        'degree': schedule['degree'],
        'prof': schedule['prof'],
        'courses': schedule['courses']
    }

    return jsonify(schedule_data)


#Route for deleting schedule
@schedule_bp.route('/api/delete_schedule/<int:schedule_id>', methods=['GET'])
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
@schedule_bp.route('/api/update_schedule/<int:schedule_id>', methods=['POST'])
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
        return jsonify({"error": "Failed to update schedule"}), 404
    
    connection.close()
    return jsonify({"success": True}), 200


#Route for importing a schedule
@schedule_bp.route('/api/import_schedule', methods=['POST'])
@login_required
def import_schedule():
    data = request.json
    schedule_name = data.get('schedule_name') + ' - Imported'
    degree = data.get('degree')
    prof = data.get('prof')
    courses = data.get('courses')
    user_id = current_user.id

    connection = get_db_connection('users')
    cursor = connection.cursor()
    try:
        cursor.execute('''
            INSERT INTO schedules (user_id, schedule_name, degree, prof)
            VALUES (%s, %s, %s, %s)
        ''', (user_id, schedule_name, degree, prof))
        schedule_id = cursor.lastrowid

        for course in courses:
            cursor.execute('''
                INSERT INTO schedule_courses (schedule_id, course_id, semester, year)
                VALUES (%s, %s, %s, %s)
            ''', (schedule_id, course['course_id'], course['semester'], course['year']))

        connection.commit()
    except:
        return jsonify({"error": "Failed to import schedule"}), 404
    
    connection.close()
    return jsonify({"success": True}), 201


# Route for loading degree and sample schedule id into session variables and redirecting to planning page
@schedule_bp.route('/load_sample_schedule/<int:schedule_id>', methods=['GET'])
@login_required
def load_sample_schedule(schedule_id):
    degree = session.get('degree')
    session['schedule_id'] = 0
    session['sample_schedule_id'] = schedule_id
    session['degree'] = degree
    global courses_selected
    courses_selected = []
    session['major_name'] = "None"
    return redirect(url_for('courses.planner'))



# Route for getting all the sample schedules of a specific degree
@schedule_bp.route('/api/get_sample_schedules', methods=['GET'])
@login_required
def get_sample_schedules():
    degree = request.args.get('degree')
    try:
        connection = get_db_connection(degree)
        cursor = connection.cursor(dictionary=True)
        cursor.execute('''
            SELECT s.schedule_id, s.schedule_name, s.degree
            FROM sample_schedules s
        ''')
        schedules = cursor.fetchall()
        connection.close()
    except:
        return jsonify({"error": "sample schedule not available"}), 404

    return jsonify(schedules)


# Route for getting specific sample schedule used in script.js for populating schedule
@schedule_bp.route('/api/get_sample_schedule/<int:schedule_id>', methods=['GET'])
@login_required
def get_sample_schedule(schedule_id):
    degree = session.get('degree')
    try:
        connection = get_db_connection(degree)
        cursor = connection.cursor(dictionary=True)
        cursor.execute('''
            SELECT s.schedule_id, s.schedule_name, s.degree, sc.course_id, sc.semester, sc.year
            FROM sample_schedules s
            JOIN sample_schedule_courses sc ON s.schedule_id = sc.schedule_id
        ''')
        schedules = cursor.fetchall()
        connection.close()
    except:
        return jsonify({"error": "sample schedule not available"}), 404

    schedules_dict = {}
    for row in schedules:
        if row['schedule_id'] not in schedules_dict:
            schedules_dict[row['schedule_id']] = {
                'schedule_name': row['schedule_name'],
                'degree': row['degree'],
                'courses': []
            }
        
        schedules_dict[row['schedule_id']]['courses'].append({
            'course_id': row['course_id'],
            'semester': row['semester'],
            'year': row['year']
        })

    schedule_data = {
        'sample_schedule_id': schedule_id,
        'schedule_name': schedules_dict[schedule_id]['schedule_name'],
        'degree': schedules_dict[schedule_id]['degree'],
        'courses': schedules_dict[schedule_id]['courses']
    }

    return jsonify(schedule_data)


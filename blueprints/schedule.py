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
    cursor.execute('SELECT degree FROM schedules WHERE schedule_id = %s AND user_id = %s', (schedule_id, current_user.id))
    schedule = cursor.fetchone()
    cursor.close()
    connection.close()

    if schedule:
        session['schedule_id'] = schedule_id
        session['degree'] = schedule['degree']
        courses_selected = []
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
    user_id = current_user.id

    connection = get_db_connection('users')
    cursor = connection.cursor()
    try:
        cursor.execute('''
            INSERT INTO schedules (user_id, schedule_name, degree)
            VALUES (%s, %s, %s)
        ''', (user_id, schedule_name, degree))
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
        SELECT s.schedule_id, s.schedule_name, s.degree, sc.course_id, sc.semester, sc.year
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
    courses = data.get('courses')
    user_id = current_user.id

    connection = get_db_connection('users')
    cursor = connection.cursor()
    try:
        cursor.execute('''
            INSERT INTO schedules (user_id, schedule_name, degree)
            VALUES (%s, %s, %s)
        ''', (user_id, schedule_name, degree))
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


from functions import get_db_connection
from flask import jsonify, request, session, Blueprint, render_template
from flask_login import login_required, current_user

courses_bp = Blueprint('courses', __name__, template_folder='templates')

courses_selected = []



@courses_bp.route('/planner', methods=['POST', 'GET'])
@login_required
def planner():
    schedule_id = session.get('schedule_id')
    prof = session.get('prof')
    global courses_selected
    courses_selected = []
    schedule_id = session.get('schedule_id')
    return render_template('index.html', schedule_id=schedule_id, prof=prof) 


#Route for getting courses and their prerequisties 
@courses_bp.route('/api/courses', methods=['GET'])
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

#Route for getting specific course
@courses_bp.route('/api/course/<course_id>', methods=['GET'])
@login_required
def get_course(course_id):
    connection = get_db_connection('Courses')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT c.CourseID, c.CourseName, c.Credits, p.RequirementID, p.PrerequisiteGroup, p.Type
        FROM Courses c
        LEFT JOIN Prerequisites p ON c.CourseID = p.CourseID
        WHERE c.CourseID = %s
    ''', (course_id,))
    course = cursor.fetchone()
    connection.close()

    if course:
        course_data = {
            'CourseID': course['CourseID'],
            'CourseName': course['CourseName'],
            'Credits': course['Credits'],
            'prerequisites': []
        }
        if course['RequirementID']:
            course_data['prerequisites'].append({
                'prerequisiteID': course['RequirementID'],
                'group': course['PrerequisiteGroup'],
                'type': course['Type']
            })
        return jsonify(course_data)
    else:
        return jsonify({'error': 'Course not found'}), 404
    

#Route for getting courses between a certain range
@courses_bp.route('/api/courses_in_range', methods=['GET'])
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


#Route for getting course from selected courses database (probably doesnt need to be inputted into database)
@courses_bp.route('/api/selected_course', methods=['POST', 'GET'])
@login_required
def get_selected_course():
    data = request.json
    course_box_id = data.get('course_box_id')

    for course in courses_selected:
        if course['course_box_id'] == str(course_box_id):
            return jsonify(course)
        
    return jsonify({'error': 'Course not found'}), 404


#Route for adding a course into selected courses table
@courses_bp.route('/api/add_course', methods=['POST'])
@login_required
def add_course():
    data = request.json
    course_box_id = data.get('course_box_id')
    user_id = current_user.id
    course_id = data.get('course_id')
    semester = data.get('semester')
    year = data.get('year')
    credits = data.get('credits')

    course = {
        'course_box_id': course_box_id,
        'courseID': course_id,
        'semester': semester,
        'year': year,
        'credits': credits
    }

    courses_selected.append(course)

    return jsonify({"success": True}), 201

#Route for removing course from selected courses table
@courses_bp.route('/api/remove_course', methods=['POST'])
@login_required
def remove_course():
    data = request.json
    course_box_id = data.get('course_box_id')
    
    global courses_selected
    courses_selected = [course for course in courses_selected if course['course_box_id'] != course_box_id]

    return jsonify({"success": True}), 201

#Route for removing all courses from row
@courses_bp.route('/api/remove_all_courses', methods=['POST'])
@login_required
def remove_all_courses():
    data = request.json
    user_id = current_user.id
    semester = data.get('semester')
    year = data.get('year')
    
    if not user_id or not semester or not year:
        return jsonify({'error': 'Missing required parameters'}), 400

    global courses_selected
    courses_selected=  [
        course for course in courses_selected
        if course['semester'] != str(semester) or course['year'] != int(year)
    ]
    
    return jsonify({'success': 'Courses removed successfully'}), 200


#Route for getting degree requirements 
@courses_bp.route('/api/requirements', methods=['GET'])
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

@courses_bp.route('/api/prof-requirements', methods=['GET'])
@login_required
def get_prof_requirements():
    prof = session.get('prof')
    connection = get_db_connection('DegreeData')
    cursor = connection.cursor(dictionary=True)
    cursor.execute(f'''
        SELECT pp.RequirementName, pp.RequirementType, ppc.CourseID, c.CourseName
        FROM PreProfessional pp 
        LEFT JOIN PreProfessionalCourses ppc ON pp.RequirementID = ppc.RequirementID
        LEFT JOIN Courses.Courses c ON ppc.CourseID = c.CourseID
        WHERE profession = '{prof}'
        ORDER BY pp.RequirementName
    ''')
    requirements = {}
    for row in cursor:
        req_name = row['RequirementName']

        if req_name not in requirements:
            requirements[req_name] = {
                'type': row['RequirementType'],
            }

        if 'courses' not in requirements[req_name]:
            requirements[req_name]['courses'] = []
            
        requirements[req_name]['courses'].append({
            'CourseID': row['CourseID'],
            'CourseName': row['CourseName'],
        })

    connection.close()
    return jsonify(requirements)



#Route for getting all completed courses by the user
@courses_bp.route('/api/completed_courses', methods=['GET'])
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

@courses_bp.route('/api/add_completed_courses', methods=['POST'])
@login_required
def add_completed_courses():
    data = request.json
    user_id = current_user.id

    connection = get_db_connection('users')
    cursor = connection.cursor()
    try:
        for course in data:
            cursor.execute('''
                INSERT INTO CoursesTaken (userID, courseID, semester, year)
                VALUES (%s, %s, %s, %s)
            ''', (user_id, course['courseID'], course['semester'], course['year']))
        connection.commit()
    except Exception as e:
        print(f'Error adding completed courses: {e}')
        return jsonify({"error": "Failed to add courses"}), 500
    finally:
        cursor.close()
        connection.close()

    return jsonify({"success": True}), 201

@courses_bp.route('/api/remove_completed_course', methods=['POST'])
@login_required
def remove_completed_course():
    data = request.json
    user_id = current_user.id

    connection = get_db_connection('users')
    cursor = connection.cursor()

    try:
        cursor.execute('''
            DELETE FROM CoursesTaken WHERE userID = %s AND courseID = %s AND semester = %s AND year=%s 
        ''', (user_id, data['courseID'], data['semester'], data['year']))
        connection.commit()
    except Exception as e:
        print(f'Error removing completed courses: {e}')
        return jsonify({"error": "Failed to remove courses"}), 500
    finally:
        cursor.close()
        connection.close()

    return jsonify({"success": True}), 201



@courses_bp.route('/courses_taken', methods=['GET'])
@login_required
def courses_taken():
    return render_template('courses_taken.html')

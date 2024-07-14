from functions import get_db_connection
from flask import jsonify, request, render_template, redirect, url_for, session, Blueprint
from flask_login import login_required


select_degree_bp = Blueprint('select_degree', __name__, template_folder='templates')

#Route for when they select only major
@select_degree_bp.route('/select_major', methods=['GET', 'POST'])
@login_required
def select_major():
    if request.method == 'POST':
        college = request.form['college']
        major = request.form['major']
        program = request.form['program']

        prof = request.form['prof']
        session['prof'] = 'None' if prof == 'None' or prof == "" else prof 
        session['degree'] = f'{college}_{major}_{program}'
        session['schedule_id'] = 0
        courses_selected = []

        return redirect(url_for('courses.planner'))
    return render_template('select_major.html')


@select_degree_bp.route('/compare_degrees', methods=['GET','POST'])
@login_required
def compare_degrees():
    if request.method =='POST':
        degree_count = int(request.form.get('degree_count'))
        degrees = []

        for i in range(1, degree_count + 1):
            college = request.form.get(f'college{i}')
            major = request.form.get(f'major{i}')
            program = request.form.get(f'program{i}')
            if college and major and program:
                degrees.append(f"{college}_{major}_{program}")

        common_courses = {}
        all_courses = {}

        for degree in degrees:
            connection = get_db_connection(degree)
            cursor = connection.cursor(dictionary=True)
            cursor.execute('''
                SELECT rc.CourseID, c.CourseName, rc.Credits
                FROM RequirementCourses rc
                LEFT JOIN Courses.Courses c ON rc.CourseID = c.CourseID
            ''')
            courses = cursor.fetchall()
            connection.close()

            courses_checked = {}
            for course in courses:
                course_id = course['CourseID']
                if course_id not in courses_checked:
                    if course_id not in all_courses:
                        all_courses[course_id] = 0
                    all_courses[course_id] += 1
                    if all_courses[course_id] == len(degrees):
                        common_courses[course_id] = course
                    courses_checked[course_id] = 'checked'

        return render_template('compare_degrees.html', common_courses=common_courses, degrees=degrees)
    return render_template('compare_degrees.html')


@select_degree_bp.route('/api/majors', methods=['GET'])
@login_required
def get_majors():
    college = request.args.get('college')
    connection = get_db_connection('DegreeData')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT MajorID, MajorName FROM Majors WHERE CollegeID = %s', (college,))
    majors = cursor.fetchall()
    connection.close()

    major_list = [{'value': major['MajorID'], 'label': major['MajorName']} for major in majors]
    return jsonify(major_list)

@select_degree_bp.route('/api/programs', methods=['GET'])
@login_required
def get_programs():
    major = request.args.get('major')
    connection = get_db_connection('DegreeData')
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT ProgramID, ProgramName FROM Programs WHERE MajorID = %s', (major,))
    programs = cursor.fetchall()
    connection.close()

    program_list = [{'value': program['ProgramID'], 'label': program['ProgramName']} for program in programs]
    return jsonify(program_list)
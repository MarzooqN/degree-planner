from flask import Flask, render_template, session, request, redirect, url_for
from flask_login import LoginManager, login_required, UserMixin, login_user
from functions import get_db_connection
from werkzeug.security import check_password_hash
from blueprints import courses, login_file, schedule, select_degree

app = Flask(__name__, template_folder='templates')
app.secret_key = 'abc123'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

app.register_blueprint(courses.courses_bp)
app.register_blueprint(login_file.login_bp)
app.register_blueprint(schedule.schedule_bp)
app.register_blueprint(select_degree.select_degree_bp)


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
            return redirect(url_for('select_degree.select_major'))
        else:
            return render_template('register.html')
        
    return render_template('login.html')

#Main route/page
@app.route('/', methods=['POST', 'GET'])
@login_required
def index():
    return render_template('select_major.html')

@app.route('/compare_plans')
@login_required
def compare_plans():
    return render_template('compare_plans.html')

if __name__ == '__main__':
    app.run(debug=True)
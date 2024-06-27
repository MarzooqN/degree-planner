from flask import render_template, session
from flask_login import login_required
from OSUDegreePlanner import app


#Main route/page
@app.route('/', methods=['POST', 'GET'])
@login_required
def index():
    schedule_id = session.get('schedule_id')
    global courses_selected
    courses_selected = []
    return render_template('index.html', schedule_id=schedule_id)
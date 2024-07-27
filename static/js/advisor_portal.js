
//Change to when the advisor submits the form
usernameBtn = document.getElementById("search-username-button");
usernameBtn.addEventListener('click', (event) => {
    const username = document.getElementById('username-input').value;

    if (!username) {
        alert('Please enter a username');
        return;
    }

    fetchSchedules(username);
});

//do call to /api/student_info?username=${username}
async function fetchSchedules(username) {
    try {
        const response = await fetch(`/api/student_info?username=${username}`);
        const student_info = await response.json();

        if(student_info.error){
            alert('Student Username Not Found');
        }

        displaySchedules(student_info);
        displayCoursesTaken(student_info);
    } catch (e) {
        console.error('Error fetching schedules:', e);
    }
}

//Change so just diaplays courses taken from student_info.courses_taken, no fetching required
function displayCoursesTaken(student_info) {

    const coursesTakenList = document.getElementById('courses-taken-ul');
    coursesTakenList.innerHTML = ''; // Clear previous list

    if(student_info.error){return}

    student_info.courses_taken.forEach(course => {
        const li = document.createElement('li');
        li.classList.add('course-taken-list')
        li.textContent = `${course.courseID} - ${course.semester} ${course.year}`;

        //Add code here for grades onces grades are apart of CoursesTaken

        coursesTakenList.appendChild(li);
    });
}

function displaySchedules(student_info) {
    const scheduleContainer = document.getElementById('schedule-container');
    scheduleContainer.innerHTML = '';  // Clear any existing content

    if(student_info.error){return}

    //Change to for each loop since endpoint return array, arguemnt should be called studentInfo so use studentInfo.degree_plans.forEach...
    student_info.degree_plans.forEach(plan => {
        const scheduleDiv = document.createElement('div');
        scheduleDiv.className = 'schedule';
        scheduleDiv.id = `schedule-${plan.schedule_id}`;

        const header = document.createElement('h4');
        header.textContent = plan.schedule_name;
        scheduleDiv.appendChild(header);

        const buttonDiv = document.createElement('div');

        const loadButton = document.createElement('button');
        const loadSpan = document.createElement('span');
        loadSpan.textContent = 'Load Plan';
        loadButton.appendChild(loadSpan);
        loadButton.onclick = () => loadSchedule(plan.schedule_id);
        buttonDiv.appendChild(loadButton);

        const exportButton = document.createElement('button');
        const exportSpan = document.createElement('span');
        exportSpan.textContent = 'Export Plan';
        exportButton.appendChild(exportSpan);
        exportButton.onclick = () => exportSchedule(plan.schedule_id);
        buttonDiv.appendChild(exportButton);
        
        scheduleDiv.appendChild(buttonDiv);
        scheduleContainer.appendChild(scheduleDiv);
    });
}

async function exportSchedule(scheduleId) {
    if (scheduleId > 0) {
        const response = await fetch(`/api/get_schedule/${scheduleId}`);
        if (response.ok) {
            const schedule = await response.json();
            const blob = new Blob([JSON.stringify(schedule)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${schedule.schedule_name}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            alert('Failed to export schedule.');
        }
    } else {
        alert('No schedule to export.');
    }
}

function loadSchedule(scheduleId) {
    window.location.href = `/load_schedule/${scheduleId}`;
}

function logout() {
    window.location.href = '/logout';
}

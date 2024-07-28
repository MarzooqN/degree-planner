document.addEventListener('DOMContentLoaded', function() {
    const schedule1 = JSON.parse(sessionStorage.getItem('schedule1'));
    const schedule2 = JSON.parse(sessionStorage.getItem('schedule2'));
    document.getElementById('schedule-1-title').textContent = schedule1.schedule_name || 'Schedule 1';
    document.getElementById('schedule-2-title').textContent = schedule2.schedule_name || 'Schedule 2';
    populateScheduleWithContainer(schedule1, 'schedule-content-1');
    populateScheduleWithContainer(schedule2, 'schedule-content-2');
});

function populateScheduleWithContainer(schedule, containerId) {
    const container = document.getElementById(containerId);

    const semesters = {};

    schedule.courses.forEach(course => {
        const semesterKey = `${course.semester}-${course.year}`;
        if (!semesters[semesterKey]) {
            semesters[semesterKey] = [];
        }
        semesters[semesterKey].push(course);
    });

    Object.keys(semesters).sort().forEach(semesterKey => {
        const [semester, year] = semesterKey.split('-');
        const semesterDiv = document.createElement('div');
        const semesterTitle = document.createElement('h3');
        semesterTitle.textContent = `${semester} ${year}`;
        semesterTitle.style.marginBottom = '5px';
        semesterDiv.appendChild(semesterTitle);

        semesters[semesterKey].forEach(course => {
            const courseBox = document.createElement('div');
            courseBox.textContent = `${course.course_id}: ${course.course_name}`;
            semesterDiv.appendChild(courseBox);
        });

        container.appendChild(semesterDiv);
    });
}

function logout() {
    window.location.href = '/logout';
}

function homepage() {
    window.location.href = '/select_major';
}

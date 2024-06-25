

document.addEventListener('DOMContentLoaded', (event) => {
    fetchSchedules();
});

async function fetchSchedules() {
    try {
        const response = await fetch('/api/get_schedules');
        const schedules = await response.json();
        displaySchedules(schedules);
    } catch (e) {
        console.error('Error fetching schedules:', e);
    }
}

async function fetchMajors(college, majorElementId, programElementId) {
    const majorSelect = document.getElementById(majorElementId);
    const programSelect = document.getElementById(programElementId);
    if (college) {
        const response = await fetch(`/api/majors?college=${college}`);
        const majors = await response.json();

        
        majorSelect.innerHTML = '<option value="">Select Major</option>';
        programSelect.innerHTML = '<option value="">Select Program</option>';

        majors.forEach(major => {
            const option = document.createElement('option');
            option.value = major.value;
            option.textContent = `${major.value} - ${major.label}`;
            majorSelect.appendChild(option);
        });
    } else {

        majorSelect.innerHTML = '<option value="">Select Major</option>';
        programSelect.innerHTML = '<option value="">Select Program</option>';

    }
}

async function fetchPrograms(major, programElementId) {
    const programSelect = document.getElementById(programElementId);
    if (major) {
        const response = await fetch(`/api/programs?major=${major}`);
        const programs = await response.json();
        programSelect.innerHTML = '<option value="">Select Program</option>';
        programs.forEach(program => {
            const option = document.createElement('option');
            option.value = program.value;
            option.textContent = program.label;
            option.textContent = `${program.value} - ${program.label}`;
            programSelect.appendChild(option);
        });
    } else {
        programSelect.innerHTML = '<option value="">Select Program</option>';

    }
}

function displaySchedules(schedules) {
    const scheduleContainer = document.getElementById('schedule-container');
    scheduleContainer.innerHTML = '';  // Clear any existing content

    for (const [scheduleId, schedule] of Object.entries(schedules)) {
        const scheduleDiv = document.createElement('div');
        scheduleDiv.className = 'schedule';
        scheduleDiv.id = `schedule-${scheduleId}`;

        const header = document.createElement('h4');
        header.textContent = schedule.schedule_name;
        scheduleDiv.appendChild(header);

        const buttonDiv = document.createElement('div');

        const loadButton = document.createElement('button');
        const loadSpan = document.createElement('span');
        loadSpan.textContent = 'Load Plan';
        loadButton.appendChild(loadSpan);
        loadButton.onclick = () => loadSchedule(scheduleId);
        buttonDiv.appendChild(loadButton);

        const deleteButton = document.createElement('button');
        const deleteSpan = document.createElement('span');
        deleteSpan.textContent = 'Delete Plan';
        deleteButton.appendChild(deleteSpan);
        deleteButton.onclick = () => deleteSchedule(scheduleId);
        buttonDiv.appendChild(deleteButton);
        
        scheduleDiv.appendChild(buttonDiv);
        scheduleContainer.appendChild(scheduleDiv);
    }
}

function loadSchedule(scheduleId) {
    window.location.href = `/load_schedule/${scheduleId}`;
}

async function deleteSchedule(scheduleId){
    try {
        const response = await fetch(`/api/delete_schedule/${scheduleId}`);
        window.location.reload();

    } catch(e) {
        console.error('Error Deleting schedule:', e);
    }

}

function logout() {
    window.location.href = '/logout';
}

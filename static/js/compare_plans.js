document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('compare-button').addEventListener('click', comparePlans);
});

function checkAndOpenComparePlansModal() {
    const numberOfPlans = document.getElementById('schedule-container').children.length;
    if (numberOfPlans < 2) {
        alert('You need 2 plans to compare.');
    } else {
        openComparePlansModal();
    }
}

function openComparePlansModal() {
    document.getElementById('comparePlansModal').style.display = 'block';
    populatePlansSelection();
}

function closeComparePlansModal() {
    document.getElementById('comparePlansModal').style.display = 'none';
}

async function populatePlansSelection() {
    try {
        const response = await fetch('/api/get_schedules');
        const schedules = await response.json();
        sessionStorage.setItem('schedules', JSON.stringify(schedules)); // Store schedules in sessionStorage

        const plansSelection = document.getElementById('plans-selection');
        plansSelection.innerHTML = '';

        Object.entries(schedules).forEach(([scheduleId, schedule]) => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'checkbox-div';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = scheduleId;
            checkbox.id = `schedule-checkbox-${scheduleId}`;
            checkbox.name = 'compare-schedules';
            checkbox.addEventListener('change', limitCheckboxSelection); // Add event listener to limit selection

            const label = document.createElement('label');
            label.htmlFor = `schedule-checkbox-${scheduleId}`;
            label.textContent = schedule.schedule_name;

            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            plansSelection.appendChild(checkboxDiv);
        });
    } catch (e) {
        console.error('Error populating plans selection:', e);
    }
}

function limitCheckboxSelection() {
    const checkboxes = document.querySelectorAll('input[name="compare-schedules"]');
    const checkedCheckboxes = document.querySelectorAll('input[name="compare-schedules"]:checked');

    if (checkedCheckboxes.length > 2) {
        alert('You can only select up to 2 plans.');
        this.checked = false; 
    }
}

async function comparePlans() {
    const selectedSchedules = document.querySelectorAll('input[name="compare-schedules"]:checked');
    if (selectedSchedules.length !== 2) {
        alert('Please select exactly two plans to compare.');
        return;
    }

    const scheduleIds = Array.from(selectedSchedules).map(checkbox => checkbox.value);
    const [scheduleId1, scheduleId2] = scheduleIds;

    const schedules = JSON.parse(sessionStorage.getItem('schedules'));
    const schedule1 = schedules[scheduleId1];
    const schedule2 = schedules[scheduleId2];

    if (schedule1 && schedule2) {
        displayComparison(schedule1, schedule2);
        closeComparePlansModal();
    } else {
        alert('One or both schedules not found.');
    }
}

function displayComparison(schedule1, schedule2) {
    const schedule1Container = document.getElementById('schedule-1');
    const schedule2Container = document.getElementById('schedule-2');

    if (!schedule1Container || !schedule2Container) {
        console.error('Schedule container elements not found');
        return;
    }

    schedule1Container.innerHTML = `<h2>${schedule1.schedule_name}</h2>`;
    schedule2Container.innerHTML = `<h2>${schedule2.schedule_name}</h2>`;

    const createScheduleList = (schedule) => {
        const list = document.createElement('ul');
        for (const semester in schedule.courses) {
            const semesterItem = document.createElement('li');
            semesterItem.textContent = `Semester: ${semester}`;
            list.appendChild(semesterItem);

            schedule.courses[semester].forEach(course => {
                const courseItem = document.createElement('li');
                courseItem.textContent = course;
                list.appendChild(courseItem);
            });
        }
        return list;
    };

    schedule1Container.appendChild(createScheduleList(schedule1));
    schedule2Container.appendChild(createScheduleList(schedule2));
}

function logout() {
    window.location.href = '/logout';
}

function homepage() {
    window.location.href = '/select_major';
}

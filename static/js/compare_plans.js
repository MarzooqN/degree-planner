document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('compare-button').addEventListener('click', comparePlans);
    document.getElementById('plans-selection').addEventListener('change', checkboxChange);
});

function checkboxChange(event) {
    if (event.target.type === 'checkbox' && event.target.name === 'compare-schedules') {
        const checkedCheckboxes = document.querySelectorAll('input[name="compare-schedules"]:checked');
        if (checkedCheckboxes.length > 2) {
            event.target.checked = false;
            alert('You can only select up to two plans.');
        }
    }
}

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
        let schedules = sessionStorage.getItem('schedules');
        if (!schedules) {
            const response = await fetch('/api/get_schedules');
            schedules = await response.json();
            sessionStorage.setItem('schedules', JSON.stringify(schedules)); 
        } else {
            schedules = JSON.parse(schedules);
        }

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
        sessionStorage.setItem('schedule1', JSON.stringify(schedule1));
        sessionStorage.setItem('schedule2', JSON.stringify(schedule2));
        window.location.href = '/compare_plans';
    } else {
        alert('One or both schedules not found.');
    }
}

function logout() {
    window.location.href = '/logout';
}

function homepage() {
    window.location.href = '/select_major';
}

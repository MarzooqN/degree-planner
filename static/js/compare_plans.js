document.addEventListener('DOMContentLoaded', function() {
    const compareButton = document.getElementById('compare-button');
    compareButton.addEventListener('click', comparePlans);
});

function checkAndOpenComparePlansModal() {
    const scheduleContainer = document.getElementById('schedule-container');
    const numberOfPlans = scheduleContainer.children.length;

    if (numberOfPlans < 2) {
        alert('You need 2 plans to compare.');
    } else {
        openComparePlansModal();
    }
}

function openComparePlansModal() {
    const modal = document.getElementById('comparePlansModal');
    modal.style.display = 'block';
    populatePlansSelection();
}

function closeComparePlansModal() {
    const modal = document.getElementById('comparePlansModal');
    modal.style.display = 'none';
}

async function populatePlansSelection() {
    try {
        const response = await fetch('/api/get_schedules');
        const schedules = await response.json();
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

    const scheduleIds = Array.from(selectedSchedules).map(input => input.value);
    const [scheduleId1, scheduleId2] = scheduleIds;

    try {
        const [schedule1Response, schedule2Response] = await Promise.all([
            fetch(`/api/get_schedule/${scheduleId1}`),
            fetch(`/api/get_schedule/${scheduleId2}`)
        ]);

        if (schedule1Response.ok && schedule2Response.ok) {
            const [schedule1, schedule2] = await Promise.all([
                schedule1Response.json(),
                schedule2Response.json()
            ]);

            sessionStorage.setItem('schedule1', JSON.stringify(schedule1));
            sessionStorage.setItem('schedule2', JSON.stringify(schedule2));

            window.location.href = '/compare_plans';
        } else {
            alert('Failed to fetch one or both schedules.');
        }
    } catch (e) {
        console.error('Error comparing schedules:', e);
    }
}

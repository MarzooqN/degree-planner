

document.addEventListener('DOMContentLoaded', (event) => {
    fetchSchedules();
    setupProgramChangeListener();
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
            option.value = `${major.value} - ${major.label}`;
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
        const response = await fetch(`/api/programs?major=${major.split("-")[0]}`);
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

        const exportButton = document.createElement('button');
        const exportSpan = document.createElement('span');
        exportSpan.textContent = 'Export Plan';
        exportButton.appendChild(exportSpan);
        exportButton.onclick = () => exportSchedule(scheduleId);
        buttonDiv.appendChild(exportButton);
        
        scheduleDiv.appendChild(buttonDiv);
        scheduleContainer.appendChild(scheduleDiv);
    }
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


async function importSchedule(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const importedSchedule = JSON.parse(e.target.result);
            const response = await fetch('/api/import_schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(importedSchedule)
            });

            if (response.ok) {
                alert('Schedule imported successfully');
                location.reload(); // Reload to reflect the imported schedule
            } else {
                alert('Failed to import schedule.');
            }
        };
        reader.readAsText(file);
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

async function fetchSampleSchedules(degree) {
    try {
        const response = await fetch(`/api/get_sample_schedules?degree=${degree}`);
        const schedules = await response.json();
        console.log(schedules)
        return schedules;
    } catch (e) {
        console.error('Error fetching sample schedules:', e);
    }
}

function displaySampleSchedules(schedules) {
    const sampleScheduleContainer = document.getElementById('sample-schedule-container');
    sampleScheduleContainer.innerHTML = '';  // Clear any existing content

    for (const [sampleScheduleId, schedule] of Object.entries(schedules)) {
        const loadButton = document.createElement('button');
        const loadSpan = document.createElement('span');
        loadSpan.textContent = schedule.schedule_name;
        loadButton.appendChild(loadSpan);
        loadButton.style.display = 'block'; 
        loadButton.onclick = () => loadSampleSchedule(schedule.schedule_id);

        sampleScheduleContainer.appendChild(loadButton);
    }
}

function loadSampleSchedule(sampleScheduleId) {
    window.location.href = `/load_sample_schedule/${sampleScheduleId}`;
}

function setupProgramChangeListener() {
    document.querySelectorAll('[id^="program"]').forEach(programSelect => {
        programSelect.addEventListener('change', async (event) => {

            // Hide the sample schedule buttons 
            let sampleButtons = document.getElementById('sample-schedule-container').getElementsByTagName('button');
            for (let button of sampleButtons) {
                button.style.display = 'none'; // Hide the buttons if no program is selected
            }

            if (event.target.value !== '') {

                const form = event.target.closest('form');
                if (form) {
                    const formData = new FormData(form);
                    const college = formData.get('college');
                    const major = formData.get('major');
                    const program = formData.get('program');
                    
                    const degree = `${college}_${major}_${program}`
                    // Fetch and display the sample schedules
                    const schedules = await fetchSampleSchedules(degree);

                    if (!schedules.error){
                        displaySampleSchedules(schedules);
                    } else {
                        // Show the sample schedule buttons
                        sampleButtons = document.getElementById('sample-schedule-container').getElementsByTagName('button');
                        for (let button of sampleButtons) {
                            button.style.display = 'none'; // Hide the buttons if no program is selected
                        }
                    }

                }
            } 
        });
    });
}


document.addEventListener('DOMContentLoaded', (event) => {
    updateDegreeSelectionForms();
});

function updateDegreeSelectionForms() {
    const degreeCount = document.getElementById('degree-count').value;
    const degreeSelectionForms = document.getElementById('degree-selection-forms');
    degreeSelectionForms.innerHTML = '';

    for (let i = 1; i <= degreeCount; i++) {
        const formSection = document.createElement('div');
        formSection.innerHTML = `<h2>Select Degree ${i}</h2>`.replace(/{{ num }}/g, i);
        formSection.innerHTML = `
            <h2>Select Degree ${i}</h2>
            <select id="college${i}" name="college${i}" onchange="fetchMajors(this.value, 'major${i}', 'program${i}')">
                <option value="">Select College</option>
                <option value="AGR">AGR - Food Agricultural and Environmental Sciences</option>
                <option value="AHR">AHR - Architecture</option>
                <option value="ASC">ASC - Arts and Sciences</option>
                <option value="ATI">ATI - Agricultural Technical Institute</option>
                <option value="BUS">BUS - Business</option>
                <option value="DHY">DHY - Dental Hygiene</option>
                <option value="EHE">EHE - Education and Human Ecology</option>
                <option value="ENG">ENG - Engineering</option>
                <option value="ENR">ENR - Environment and Natural Resources</option>
                <option value="HRS">HRS - Health and Rehabilitation Sciences</option>
                <option value="JGS">JGS - John Glenn College of Public Affairs</option>
                <option value="LAW">LAW - Law</option>
                <option value="MED">MED - Medicine</option>
                <option value="NUR">NUR - Nursing</option>
                <option value="PBH">PBH - Public Health</option>
                <option value="PHR">PHR - Pharmacy</option>
                <option value="SWK">SWK - Social Work</option>
            </select>
            <select id="major${i}" name="major${i}" onchange="fetchPrograms(this.value, 'program${i}')">
                <option value="">Select Major</option>
            </select>
            <select id="program${i}" name="program${i}">
                <option value="">Select Program</option>
            </select>
        `;
        degreeSelectionForms.appendChild(formSection);
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

function logout() {
    window.location.href = '/logout';
}

function homepage() {
    window.location.href = '/select_major';
}

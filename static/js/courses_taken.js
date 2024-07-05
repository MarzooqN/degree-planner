let courseFormCount = 1;
let courseData = [];

document.addEventListener('DOMContentLoaded', (event) => {
    populateCourseOptions();
    fetchCoursesTaken();
});

async function populateCourseOptions() {
    const response = await fetch('/api/courses');
    courseData = await response.json();

    console.log(courseData)

    const initialCourseSelect = document.getElementById('course-select-0');
    populateCourseSelectOptions(initialCourseSelect, courseData);

    // Initialize Select2 on the initial course select element
    $('.course-select').select2({
        placeholder: "Search for a course",
        allowClear: true
    });
}

function populateCourseSelectOptions(selectElement, courses) {
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.CourseID;
        option.textContent = `${course.CourseID} - ${course.CourseName}`;
        selectElement.appendChild(option);
    });
}

function addCourseForm() {
    const container = document.getElementById('course-forms-container');

    const newForm = document.createElement('div');
    newForm.className = 'course-form';

    const courseDiv = document.createElement('div');
    const courseLabel = document.createElement('label');
    courseLabel.htmlFor = `course-select-${courseFormCount}`;
    courseLabel.textContent = 'Select Course:';
    courseDiv.appendChild(courseLabel);

    const courseSelect = document.createElement('select');
    courseSelect.id = `course-select-${courseFormCount}`;
    courseSelect.name = `course-${courseFormCount}`;
    courseSelect.className = 'course-select';
    populateCourseSelectOptions(courseSelect, courseData);
    courseDiv.appendChild(courseSelect);
    newForm.appendChild(courseDiv);

    const semesterDiv = document.createElement('div');
    const semesterLabel = document.createElement('label');
    semesterLabel.htmlFor = `semester-select-${courseFormCount}`;
    semesterLabel.textContent = 'Select Semester:';
    semesterDiv.appendChild(semesterLabel);

    const semesterSelect = document.createElement('select');
    semesterSelect.id = `semester-select-${courseFormCount}`;
    semesterSelect.name = `semester-${courseFormCount}`;
    semesterSelect.innerHTML = `
        <option value="AU">Autumn</option>
        <option value="SP">Spring</option>
        <option value="SU">Summer</option>
    `;
    semesterDiv.appendChild(semesterSelect);
    newForm.appendChild(semesterDiv);

    const yearDiv = document.createElement('div');
    const yearLabel = document.createElement('label');
    yearLabel.htmlFor = `year-select-${courseFormCount}`;
    yearLabel.textContent = 'Select Year:';
    yearDiv.appendChild(yearLabel);

    const yearInput = document.createElement('input');
    yearInput.type = 'number';
    yearInput.id = `year-select-${courseFormCount}`;
    yearInput.name = `year-${courseFormCount}`;
    yearInput.min = '18';
    yearInput.max = '24';
    yearInput.required = true;
    yearDiv.appendChild(yearInput);
    newForm.appendChild(yearDiv);

    
    container.appendChild(newForm);
    
    const hr = document.createElement('hr')
    container.appendChild(hr);


    // Initialize Select2 on the newly added course select element
    $(`#course-select-${courseFormCount}`).select2({
        placeholder: "Search for a course",
        allowClear: true
    });

    courseFormCount++;
}

async function fetchCoursesTaken() {
    const response = await fetch('/api/completed_courses');
    const courses = await response.json();
    const coursesTakenList = document.getElementById('courses-taken-ul');
    coursesTakenList.innerHTML = ''; // Clear previous list

    courses.forEach(course => {
        const li = document.createElement('li');
        li.textContent = `${course.courseID} - ${course.semester} ${course.year}`;
        coursesTakenList.appendChild(li);
    });
}

async function submitCoursesTaken(event) {
    event.preventDefault();
    const form = document.getElementById('courses-taken-form');
    const formData = new FormData(form);

    const coursesData = [];
    for (let i = 0; i < courseFormCount; i++) {
        if (formData.get(`course-${i}`)) {
            coursesData.push({
                courseID: formData.get(`course-${i}`),
                semester: formData.get(`semester-${i}`),
                year: parseInt(formData.get(`year-${i}`))
            });
        }
    }

    const response = await fetch('/api/add_completed_courses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(coursesData)
    });

    if (response.ok) {
        fetchCoursesTaken(); // Refresh the list
        form.reset(); // Clear the form
        document.getElementById('course-forms-container').innerHTML = ''; // Clear dynamically added forms
        courseFormCount = 1; // Reset form count
        addCourseForm(); // Add initial form
    } else {
        alert('Failed to add courses. Please try again.');
    }
}

function logout() {
    window.location.href = '/logout';
}

function homepage() {
    window.location.href = '/select_major';
}

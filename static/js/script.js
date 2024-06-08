// script.js
let semesterCount = 0;
let semesterNum = 24;
let selectedCourses = [];
let courseData = [];
let completedCourses = [];
let requirementsData = {};


/*
When page is loaded get course data based on specified major and user data
*/
document.addEventListener('DOMContentLoaded', (event) => {
    fetchAllData();
    modalFunctionality();
});

async function fetchAllData() {

    const scheduleId = parseInt(document.getElementById('schedule-id').value);
    await fetchCourseData();
    await fetchUserData();
    fetchRequirementsData();

    if (scheduleId > 0){
        loadSavedSchedule(scheduleId);
    }
}

function modalFunctionality(){

    //Declare needed elements
    const modal = document.getElementById('prerequisiteModal');
    const lookupPrereqBtn = document.getElementById('lookupPrereqBtn');
    const span = document.getElementsByClassName('close')[0];
    const submitBtn = document.getElementById('lookupPrereqSubmit');

    //When the look up prereq button is clicked modal becomes visible
    lookupPrereqBtn.onclick = function() {
        modal.style.display = 'block';
    }

    //When the x is clicked the modal goes away
    span.onclick = function() {
        modal.style.display = 'none';
    }

    //If you click outside of the modal the modal will go away
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    //When course id is inputted it will make sure there is a course id present and display the prerequistes
    submitBtn.onclick = function() {
        const courseId = document.getElementById('courseIDInput').value;
        if (courseId) {
            displayPrerequisites(courseId);
        } else {
            alert('Please enter a course ID.');
        }
    }

}

/*
Function to display prerequisites for a given course
*/
function displayPrerequisites(courseId) {
    const course = courseData.find(course => course.CourseID === courseId);
    const resultDiv = document.getElementById('prerequisiteResult');
    resultDiv.innerHTML = '';  // Clear previous results

    if (course) {
        const courseNameElem = document.createElement('h3');
        courseNameElem.textContent = `${course.CourseID} - ${course.CourseName}`;
        resultDiv.appendChild(courseNameElem);

        const prerequisitesElemHeader = document.createElement('h4');
        prerequisitesElemHeader.textContent = `Prerequisites - Select 1 from each group:`;
        resultDiv.appendChild(prerequisitesElemHeader);

        

        // Gets only Prerequisites from list of requirements in course object
        const prerequisites = course.prerequisites.filter(req => req.type === 'prerequisite');

        // Check prerequisite groups, for each requirement in prerequisites it checks if that requirement's group is in the groups dictionary if not then adds it 
        // in the end pushing the requirement to its specific group 
        const groups = {};
        prerequisites.forEach(req => {
            if (!groups[req.group]) {
                groups[req.group] = [];
            }
            groups[req.group].push(req.prerequisiteID);
        });

        for(const group in groups){
            const groupElem = document.createElement('p');
            const groupPrereqs = groups[group];
            groupElem.textContent = `Group ${group}: ${groupPrereqs.join(', ')}`;
            resultDiv.appendChild(groupElem);
        }
        
    } else {
        resultDiv.textContent = 'Course not found.';
    }
}


/*
Function to load a saved schedule
*/
async function loadSavedSchedule(scheduleId) {
    try {
        const response = await fetch(`/api/get_schedule/${scheduleId}`);
        const schedule = await response.json();
        populateSchedule(schedule);
    } catch (e) {
        console.error('Error loading saved schedule:', e);
    }
}

async function populateSchedule(schedule) {

    const semestersNeeded = new Set();
    
    for (const course of schedule.courses){
        const { semester, year } = course;
        semestersNeeded.add(`${semester}-${year}`);
    }

    // Sorts semesters needed by their comparable values and creates the necessary semesters 
    const sortedSemesters = Array.from(semestersNeeded).sort((a, b) => {
        const [semA, yearA] = a.split('-');
        const [semB, yearB] = b.split('-');
        const valueA = convertToComparableValue(semA, parseInt(yearA));
        const valueB = convertToComparableValue(semB, parseInt(yearB));
        return valueA - valueB;
    });

    sortedSemesters.forEach(semYear => {
        const [semester, year] = semYear.split('-');
        addSemester(semester, parseInt(year));
    });

    //Adds courses and their specified semesters
    for (const course of schedule.courses) {
        const { course_id, semester, year } = course;
        await addCourseBox(semester, year, course_id);
    }
}



/*
Function to get user data
*/
async function fetchUserData(){
    try {
        const response = await fetch('/api/completed_courses');
        const courses = await response.json();
        completedCourses = courses;

    } catch(e) {
        console.error('Error fetching user course data:', e);
    }
    
}

/*
Function to get course data
*/
async function fetchCourseData() {
    try {
        const response = await fetch(`/api/courses`);
        const courses = await response.json();
        courseData = courses;
        console.log(courseData);

    } catch(e) {
        console.error('Error fetching course data:', e);
    }
}

/*
Function to get requirement data
*/
async function fetchRequirementsData() {
    try {
        const response = await fetch(`/api/requirements`);
        const requirements = await response.json();
        requirementsData = requirements;
        displayRequirements();
    } catch (e) {
        console.error('Error fetching requirements data:', e);
    }
}

/*
Function to create requirements section 
*/
function displayRequirements() {
    const requirementsDiv = document.getElementById('degree-requirements');
    requirementsDiv.innerHTML = '';  // Clear any existing content

    for (const [reqName, courses] of Object.entries(requirementsData)) {
        const reqDiv = document.createElement('div');
        reqDiv.className = 'requirement';
        reqDiv.id = `requirement-${reqName.replace(/ /g, '-')}`;
        const header = document.createElement('h4');
        header.textContent = reqName;
        reqDiv.appendChild(header);

        const ul = document.createElement('ul');
        courses.forEach(course => {
            const li = document.createElement('li');
            li.textContent = `${course.CourseID} - ${course.CourseName}`;
            ul.appendChild(li);
        });
        reqDiv.appendChild(ul);
        requirementsDiv.appendChild(reqDiv);
    }
}

/*
Function to update requirements section 
*/
function updateRequirementFulfillment() {
    for (const [reqName, courses] of Object.entries(requirementsData)) {
        const reqDiv = document.getElementById(`requirement-${reqName.replace(/ /g, '-')}`);
        let coursesFulfilled = courses.every(course =>completedCourses.some(completedCourse => completedCourse.courseID === course.CourseID));
        
        if(!coursesFulfilled){
            coursesFulfilled = courses.every(course =>
                selectedCourses.some(selectedCourse => selectedCourse.CourseID === course.CourseID)
            );
        }

        if (coursesFulfilled) {
            reqDiv.classList.add('fulfilled');
        } else {
            reqDiv.classList.remove('fulfilled');
        }
    }
}

/*
Function to add semester row
*/
function addSemester(term = null, year = null) {
    
    //Declares costants
    const semesters = ['AU', 'SP', 'SU'];
    const semesterTerm = term || semesters[semesterCount];
    const semesterYear = year || semesterNum;
    
    //Gets div that houses all semesters
    const semesterRows = document.getElementById('semester-rows');

    // Creates semester row divider 
    const semesterRow = document.createElement('div');
    semesterRow.classList.add('semester-row');

    // Creates header for semester row 
    const header = document.createElement('h3');
    header.id = `${semesterTerm} ${semesterYear}`
    header.textContent = `${semesterTerm} ${semesterYear}: 0 Credit Hours`;
    header.dataset.credits = 0;
    semesterRow.appendChild(header);

    // Creates semester divider
    const semester = document.createElement('div');
    semester.classList.add('semester');
    semester.id = `${semesterTerm}-${semesterYear}`
    
    //Creates button to add courses
    const addCourseButton = document.createElement('div');
    addCourseButton.classList.add('add-course');
    addCourseButton.setAttribute('onclick', `addCourseBox('${semesterTerm}', ${semesterYear})`);
    addCourseButton.textContent = '+';
    semester.appendChild(addCourseButton);
    
    semesterRow.appendChild(semester);
    semesterRows.appendChild(semesterRow);
    

    const skipButton = document.getElementById('skip-button');

    if(semesterTerm === 'SP'){
        const semesterdiv = document.getElementById('add-semester-div');
        const skipSummerButton = document.createElement('button');
        skipSummerButton.onclick = () => skipSummer();
        skipSummerButton.textContent = 'Skip Summer';
        skipSummerButton.id = 'skip-button'
        semesterdiv.appendChild(skipSummerButton);

    } else if (skipButton){
        const semesterdiv = document.getElementById('add-semester-div');
        semesterdiv.removeChild(skipButton);
    }
    
    if(semesterCount == 0){
        semesterNum++;
    }

    if (year){
        semesterNum = year;
    }

    semesterCount++;
    if(semesterCount % 3 == 0){
        semesterCount = 0;
    }

}

function skipSummer(){
    semesterCount = 0;
    addSemester();
}


/*
Function to create course list/box
*/
let courseBoxNum = 0;
async function addCourseBox(semesterTerm, semesterNum, courseID = null) {
    const semester = document.getElementById(`${semesterTerm}-${semesterNum}`);
   
    //Creates course box divder
    const courseBox = document.createElement('div');
    courseBox.id = `${semesterTerm}-${semesterNum}-${courseBoxNum}`;
    courseBox.classList.add('course-box');

    //Creates select element/list for selecting classes 
    const selectList = document.createElement('select');
    selectList.className = 'course-select'
    selectList.id = `course-select-${semesterTerm}-${semesterNum}-${courseBoxNum}`;
    selectList.setAttribute('onchange', `courseChange(this, '${semesterTerm}', ${semesterNum}, '${courseBox.id}')`);
    
    //Creates first option for list
    const option = document.createElement('option');
    option.textContent = "Click to Select Course";
    selectList.appendChild(option);

    //Loops through each course in courseData and adds them to list, specifiying course prerequisites in dataset
    for (const course of courseData){
        const option = document.createElement('option');
        option.value = course.CourseID;
        option.textContent = `${course.CourseID} - ${course.CourseName}`;
        option.dataset.prerequisites = JSON.stringify(course.prerequisites)
        selectList.appendChild(option);
    } 
    courseBox.appendChild(selectList);

    //Creates remove button
    const removeButton = document.createElement('div');
    removeButton.className = "remove-course";
    removeButton.setAttribute('onclick',`removeCourseBox('${courseBox.id}', '${semester.id}', '${semesterTerm}', ${semesterNum})`);
    removeButton.textContent = 'X'
    courseBox.appendChild(removeButton);

    semester.appendChild(courseBox);
    courseBoxNum++;

    if(courseID){
        selectList.value = courseID;
        await courseChange(selectList, semesterTerm, semesterNum, courseBox.id)
    }


}

/*
When course selection is changed, changes database and lists accordingly
*/
async function courseChange(selectElement, semesterTerm, semesterNum, courseBoxID){
    if (selectElement.value == "Click to Select Course"){
        await removeSelectedCourse(courseBoxID, semesterTerm, semesterNum);
    } else {
        await checkAndAddCourse(selectElement, semesterTerm, semesterNum, courseBoxID);
    }
}


// Mapping of terms to numerical values for comparison
const termOrder = {
    'SP': 1,
    'SU': 2,
    'AU': 3
};

// Helper function to convert semester term and year to a comparable value
function convertToComparableValue(term, year) {
    return year * 10 + termOrder[term];
}


/*
Function to check if user already selected course in the semester 
*/
function checkSemesterForCourse(currentSemesterValue, selectedCourseID){

    for (const testedCourse of selectedCourses) {
        const selectedSemesterValue = convertToComparableValue(testedCourse.semester, testedCourse.year);
        if (testedCourse.CourseID === selectedCourseID && selectedSemesterValue === currentSemesterValue) {
            return true;
        }
    }

    return false;
}


/*
Function to check if user can take this a course and updating database if they can 
*/
async function checkAndAddCourse(selectElement, semesterTerm, semesterNum, courseBoxID){
    
    //Get selected course 
    const selectedCourseID = selectElement.value;
    const selectedCourse = courseData.find(course => course.CourseID === selectedCourseID);

    //Check if total credit hours less than 18 
    header = document.getElementById(`${semesterTerm} ${semesterNum}`);
    if (parseInt(header.dataset.credits) + selectedCourse.Credits > 18){
        selectElement.value = "Click to Select Course"; // Reset selection
        alert('Cannot add course: exceeds 18 credit hour limit');
        return;
    }


    //Converts semester and year into value that can be compared 
    const currentSemesterValue = convertToComparableValue(semesterTerm, semesterNum);

    //Checks if course is already selected in the semester
    const alreadySelected = checkSemesterForCourse(currentSemesterValue, selectedCourseID)
    if(alreadySelected){
        selectElement.value = "Click to Select Course"; // Reset selection
        alert('Cannot add course: Already selected in semester');
        return;
    }

    //Get course prerequisites and check if prereq already completed
    const requirements = JSON.parse(selectElement.options[selectElement.selectedIndex].dataset.prerequisites);

    // Separate prerequisites and corequisites
    const prerequisites = requirements.filter(req => req.type === 'prerequisite');
    const corequisites = requirements.filter(req => req.type === 'corequisite');

    // Check prerequisite groups, for each requirement in prerequisites it checks if that requirement's group is in the groups dictionary if not then adds it 
    // in the end pushing the requirement to its specific group 
    const groups = {};
    prerequisites.forEach(req => {
        if (!groups[req.group]) {
            groups[req.group] = [];
        }
        groups[req.group].push(req.prerequisiteID);
    });


    let allGroupsSatisfied = true;
    
    //checks each group in groups to make sure at least 1 from each group is satisfied 
    for (const group in groups) {
        const groupPrereqs = groups[group];
        const groupSatisfied = groupPrereqs.some(prereq => 
            completedCourses.some(course => course.courseID === prereq) ||
            selectedCourses.some(course => course.CourseID === prereq && convertToComparableValue(course.semester, course.year) < currentSemesterValue)
        );

        if (!groupSatisfied) {
            allGroupsSatisfied = false;
            alert(`You have not met the prerequisites for this course.`);
            selectElement.value = "Click to Select Course"; // Reset selection
            return;
        }
    }

    // Check corequisites
    /*
    TODO: Fix coreq logic

    const allCorequisitesSatisfied = corequisites.every(coreq => 
        completedCourses.some(course => course.courseID === coreq.prerequisiteID) ||
        selectedCourses.some(course => course.CourseID === coreq.prerequisiteID && convertToComparableValue(course.semester, course.year) <= currentSemesterValue)
    );

    if (!allCorequisitesSatisfied) {
        alert('You have not met the corequisites for this course.');
        selectElement.value = "Click to Select Course"; // Reset selection
        return;
    }

    */

    //Creates course object to send to database
    const courseSelected = {
        course_box_id: courseBoxID,
        course_id: selectedCourseID,
        semester: semesterTerm,
        year: semesterNum,
        credits: selectedCourse.Credits
    };

    try {
        const response = await fetch('/api/add_course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseSelected)
            
        });

        //If the response was okay then adds semester and year attribute to courses and puts them into the selectedCourses list
        if (response.ok) {
            selectedCourse.semester = `${semesterTerm}`;
            selectedCourse.year = semesterNum;
            selectedCourses.push(selectedCourse)

            selectElement.value = selectedCourseID;

            header = document.getElementById(`${semesterTerm} ${semesterNum}`);
            header.dataset.credits = parseInt(header.dataset.credits) + selectedCourse.Credits;
            header.textContent = `${semesterTerm} ${semesterNum}: ${header.dataset.credits} Credit Hours`;

            updateRequirementFulfillment();
        } else {
            const error = await response.json();
            console.error('Error adding course 1:', error);
            alert('Error adding course. Please try again.');
            selectElement.value = "Click to Select Course"; // Reset selection
        }

    } catch (e) {
        console.error('Error adding course 2: ', e);
        alert('Error adding course. Please try again.');
        selectElement.value = "Click to Select Course"; // Reset selection
    }
}


/*
Function to remove course/coursebox from database
*/
async function removeSelectedCourse(courseBoxID, semesterTerm, semesterNum){


    //Creates course object to remove from database
    const removeCourse = {
        course_box_id: courseBoxID
    } 

    //Gets courseID of what to remove 
    let courseID;
    let credits;
    try {
        const response = await fetch('/api/selected_course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(removeCourse)
            
        });

        const course = await response.json();
        courseID = course[0].courseID; 
        credits = course[0].credits;

    } catch (e) {
        console.error('Error getting courseID: ', e);
        alert('Error removing course. Please try again.');
        return;
    }

    //Removes course from database
    try {
        const response = await fetch('/api/remove_course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(removeCourse)

        });

        //If the response was okay removes course from selectedCourses list using the courseID
        if (response.ok) {
            selectedCourses = selectedCourses.filter(course => course.CourseID !== courseID);
            
            header = document.getElementById(`${semesterTerm} ${semesterNum}`);
            header.dataset.credits = parseInt(header.dataset.credits) - credits;
            header.textContent = `${semesterTerm} ${semesterNum}: ${header.dataset.credits} Credit Hours`;

            updateRequirementFulfillment();
        } else {
            const error = await response.json();
            console.error('Error removing course 1:', error);
            alert('Error removing course. Please try again.');
        }

    } catch (e) {
        console.error('Error removing course 2: ', e);
        alert('Error removing course. Please try again.');
    }


}


/*
Function to remove course box/list 
*/
function removeCourseBox(courseBoxID, semesterID, semesterTerm, semesterNum) {
    const semester = document.getElementById(semesterID);
    const courseBox = document.getElementById(courseBoxID);
    const selectElement = courseBox.querySelector('select');
    const selectedCourseID = selectElement.value;

    if (selectedCourseID !== "Click to Select Course") {
        removeSelectedCourse(courseBoxID, semesterTerm, semesterNum);
    }
    semester.removeChild(courseBox);

}

/*
Function to save the current schedule
*/
async function saveSchedule() {
    const scheduleId = parseInt(document.getElementById('schedule-id').value);

    if (scheduleId > 0) {
        const action = prompt("Do you want to update the current schedule or create a new one? Type 'update' to update or 'new' to create a new schedule:").toLowerCase();

        if (action === 'update') {
            updateSchedule(scheduleId);
        } else if (action === 'new') {
            createNewSchedule();
        } else {
            alert("Invalid action. Please type 'update' or 'new'.");
        }
    } else {
        createNewSchedule();
    }
}

async function updateSchedule(scheduleId) {
    const courses = selectedCourses.map(course => ({
        course_id: course.CourseID,
        semester: course.semester,
        year: course.year
    }));

    const scheduleData = {
        schedule_id: scheduleId,
        courses: courses
    };

    try {
        const response = await fetch(`/api/update_schedule/${scheduleId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });

        if (response.ok) {
            alert('Schedule updated successfully');
        } else {
            alert('Failed to update schedule');
        }
    } catch (e) {
        console.error('Error updating schedule:', e);
        alert('Failed to update schedule.');
    }
}

async function createNewSchedule() {
    const scheduleName = prompt("Enter a name for your schedule:");

    if (!scheduleName) {
        alert("Schedule name cannot be empty.");
        return;
    }

    const courses = selectedCourses.map(course => ({
        course_id: course.CourseID,
        semester: course.semester,
        year: course.year
    }));

    const scheduleData = {
        schedule_name: scheduleName,
        courses: courses
    };

    try {
        const response = await fetch('/api/save_schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });

        if (response.ok) {
            alert('Schedule saved successfully');
        } else {
            alert('Failed to save schedule');
        }
    } catch (e) {
        console.error('Error saving schedule:', e);
        alert('Failed to save schedule.');
    }
}



/*
Function to redirect user to loading/making new schedule
*/
function newSchedule() {
    
    if(confirm('Save this schedule?')){
        saveSchedule();
    }
    
    window.location.href = `/select_major`;
}

/*
Function to log out the user
*/
function logout() {
    window.location.href = '/logout';
}

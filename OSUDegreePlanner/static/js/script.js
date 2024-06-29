// script.js
let semesterCount = 0;
let semesterNum = 24;
let selectedCourses = [];
let courseData = [];
let completedCourses = [];
let requirementsData = {};
const scheduleId = parseInt(document.getElementById('schedule-id').value);

let loadingSchedule = false;
if(scheduleId > 0){
    loadingSchedule = true;
}


/*
When page is loaded get course data based on specified major and user data
*/
document.addEventListener('DOMContentLoaded', (event) => {
    validCoursesModalFunctionality();
    messageModalFunctionality();
    saveScheduleModalFunctionality();
    loadedScheduleModalFunctionality();
    newScheduleModalFunctionality();
    prereqModalFunctionality();
    fetchAllData();
});

async function fetchAllData() {

    const waitModal = document.getElementById('waitModal');
    openModal(waitModal);

    const scheduleId = parseInt(document.getElementById('schedule-id').value);
    await fetchCourseData();
    await fetchUserData();

    await fetchRequirementsData();

    if (scheduleId > 0){
        await loadSavedSchedule(scheduleId);
    } else {
        closeModal(waitModal);
    }
}

function openModal(modal){
    modal.style.display = 'block';
}

function closeModal(modal){
    modal.style.display = 'none';
}

function validCoursesModalFunctionality(){

    //Declare needed elements
    const modal = document.getElementById('validCoursesModal');
    const span = document.getElementsByClassName('close')[4];
    const okayBtn = document.getElementById('validCoursesOkay');

    //When the x is clicked the modal goes away
    span.onclick = function() {
        modal.style.display = 'none';
    }

    //When okay is clicked the modal goes away
    okayBtn.onclick = function() {
        modal.style.display = 'none';
    }
}

function messageModalFunctionality(){

    //Declare needed elements
    const modal = document.getElementById('messageModal');
    const span = document.getElementsByClassName('close')[3];
    const okayBtn = document.getElementById('messageOkay');

    //When the x is clicked the modal goes away
    span.onclick = function() {
        modal.style.display = 'none';
    }

    //When okay is clicked the modal goes away
    okayBtn.onclick = function() {
        modal.style.display = 'none';
    }
}

function saveScheduleModalFunctionality(){

    //Declare needed elements
    const modal = document.getElementById('saveScheduleModal');
    const span = document.getElementsByClassName('close')[2];
    const submitBtn = document.getElementById('schdeuleNameSubmit');

    //When the x is clicked the modal goes away
    span.onclick = function() {
        modal.style.display = 'none';
    }

    //When schedule name is inputed create new schedule
    submitBtn.onclick = function() {
        const scheduleName = document.getElementById('scheduleNameInput').value;
        if (scheduleName) {
            createNewSchedule(scheduleName);
            modal.style.display = 'none';
        } else {
            alert('Please enter a Schedule Name - Schedule name cannot be empty');
        }
    }

}

function loadedScheduleModalFunctionality(){

    //Declare needed elements
    const modal = document.getElementById('loadedScheduleModal');
    const span = document.getElementsByClassName('close')[1];
    const updateBtn = document.getElementById('loadedScheduleUpdate');
    const newBtn = document.getElementById('loadedScheduleNew');

    //When the x is clicked the modal goes away
    span.onclick = function() {
        modal.style.display = 'none';
    }

    //When update button clicked schedule is updated
    updateBtn.onclick = function() {
        updateSchedule(scheduleId);
        modal.style.display = 'none';
    }

    //When new button is clicked new schedule is created
    newBtn.onclick = function() {
        const saveScheduleModal = document.getElementById('saveScheduleModal');
        openModal(saveScheduleModal);
        modal.style.display = 'none';

    }
}

function newScheduleModalFunctionality(){

    //Declare needed elements
    const modal = document.getElementById('newScheduleModal');
    const newScheduleBtn = document.getElementById('newScheduleBtn');
    const noBtn = document.getElementById('newScheduleNo');
    const yesBtn = document.getElementById('newScheduleYes');

    //When the new schdule button is clicked modal becomes visible
    newScheduleBtn.onclick = function() {
        modal.style.display = 'block';
    }

    //When no button is clicked modal goes away and user is redirected to select major page
    noBtn.onclick = function() {
        modal.style.display = 'none';
        window.location.href = `/select_major`;
    }

    //When yes is clicked schedule is saved
    yesBtn.onclick = function() {
        modal.style.display = 'none';
        saveSchedule();
    }
}

function prereqModalFunctionality(){

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
function displayPrerequisites(courseId, div = null) {
    const course = courseData.find(course => course.CourseID === courseId);
    const resultDiv = div || document.getElementById('prerequisiteResult');
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

    const waitModal = document.getElementById('waitModal');
    openModal(waitModal);


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
        if (course_id === 'Internship' && semester ==='SU'){
            addInternshipText(semester, year)
        } else {
            await addCourseBox(semester, year, course_id);
        }
    }

    closeModal(waitModal);
    loadingSchedule = false;
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
        console.log(requirementsData)
        await displayRequirements();
    } catch (e) {
        console.error('Error fetching requirements data:', e);
    }
}


/*
Function to get courses between a certain range
*/
async function fetchCoursesInRange(prefix, min, max) {
    try {
        const response = await fetch(`/api/courses_in_range?prefix=${prefix}&min=${min}&max=${max}`);
        const courses = await response.json();
        return courses;
    } catch (e) {
        console.error('Error fetching courses in range:', e);
        return [];
    }
}



/*
Function to create requirements section 
*/
async function displayRequirements() {
    const requirementsDiv = document.getElementById('degree-requirements');
    requirementsDiv.innerHTML = '';  // Clear any existing content

    for (const [reqName, reqData] of Object.entries(requirementsData)) {
        const reqDiv = document.createElement('div');
        reqDiv.className = 'requirement';
        reqDiv.id = `requirement-${reqName.replace(/ /g, '-')}`;
        const header = document.createElement('h4');
        header.textContent = reqName;
        reqDiv.appendChild(header);

        if (reqData.type === 'some_courses') {
            for (const [group, courses] of Object.entries(reqData.groups)) {
                const groupHeader = document.createElement('h5');
                groupHeader.textContent = `Group ${group} - Select 1 from this group`;
                reqDiv.appendChild(groupHeader);

                const ul = document.createElement('ul');
                courses.forEach(course => {
                    const li = document.createElement('li');
                    li.textContent = `${course.CourseID} - ${course.CourseName}`;
                    li.setAttribute('data-course-id', course.CourseID); // Unique identifier
                    ul.appendChild(li);
                });
                reqDiv.appendChild(ul);
            }
        } else if (reqData.type === 'credit_hours' && reqData.course_prefix && reqData.min_course_number && reqData.max_course_number) {
            const courses = await fetchCoursesInRange(reqData.course_prefix, reqData.min_course_number, reqData.max_course_number);
            reqData.courses = courses
            header.textContent += ` - Complete ${reqData.required_credits} Credit Hours`
            const dynamicCoursesBtn = document.createElement('button');
            dynamicCoursesBtn.textContent = 'View Eligible Courses';
            dynamicCoursesBtn.onclick = () => {
                //TODO: Change this to modal 

                const modal = document.getElementById('validCoursesModal');
                const validCourses = document.getElementById('validCourses');
                validCourses.innerHTML = ''
                courses.forEach(course => {
                    const li = document.createElement('li');
                    li.textContent = `${course.CourseID} - ${course.CourseName} (${course.Credits} Credits)`;
                    li.setAttribute('data-course-id', course.CourseID); // Unique identifier
                    validCourses.appendChild(li);
                });
                openModal(modal);
                
            };
            reqDiv.appendChild(dynamicCoursesBtn);
        } else if (reqData.type === 'credit_hours') {
            header.textContent += ` - Complete ${reqData.required_credits} Credit Hours`
            const ul = document.createElement('ul');
            reqData.courses.forEach(course => {
                const li = document.createElement('li');
                li.textContent = `${course.CourseID} - ${course.CourseName} (${course.Credits} Credits)`;
                li.setAttribute('data-course-id', course.CourseID); // Unique identifier
                ul.appendChild(li);
            });
            reqDiv.appendChild(ul);
        } else {
            const ul = document.createElement('ul');
            reqData.courses.forEach(course => {
                const li = document.createElement('li');
                li.textContent = `${course.CourseID} - ${course.CourseName}`;
                li.setAttribute('data-course-id', course.CourseID); // Unique identifier
                ul.appendChild(li);
            });
            reqDiv.appendChild(ul);
        }
        requirementsDiv.appendChild(reqDiv);
    }
}



/*
Function to update requirements section 
*/
function updateRequirementFulfillment() {
    for (const [reqName, reqData] of Object.entries(requirementsData)) {
        const reqDiv = document.getElementById(`requirement-${reqName.replace(/ /g, '-')}`);
        let coursesFulfilled = false;

        // Remove the completed-course class from all courses
        const courseLis = reqDiv.querySelectorAll('li[data-course-id]');
        courseLis.forEach(courseLi => {
            courseLi.classList.remove('completed-course');
        });

        if (reqData.type === 'all_courses') {
            coursesFulfilled = reqData.courses.every(course => {
                const isCourseCompleted = completedCourses.some(completedCourse => completedCourse.courseID === course.CourseID);
                const isCourseSelected = selectedCourses.some(selectedCourse => selectedCourse.CourseID === course.CourseID);
                if (isCourseSelected || isCourseCompleted) {
                    const courseLi = reqDiv.querySelector(`[data-course-id="${course.CourseID}"]`);
                    if (courseLi) {
                        courseLi.classList.add('completed-course');
                    }
                }
                return isCourseCompleted || isCourseSelected;
            });
        } else if (reqData.type === 'credit_hours') {
            const totalCredits = reqData.courses.reduce((sum, course) => {
                const isCourseCompleted = completedCourses.some(completedCourse => completedCourse.courseID === course.CourseID);
                const isCourseSelected = selectedCourses.some(selectedCourse => selectedCourse.CourseID === course.CourseID);
                if (isCourseSelected || isCourseCompleted) {
                    const courseLi = reqDiv.querySelector(`[data-course-id="${course.CourseID}"]`);
                    if (courseLi) {
                        courseLi.classList.add('completed-course');
                    }
                }
                if (isCourseCompleted || isCourseSelected) {
                    return sum + course.Credits;
                }
                return sum;
            }, 0);
            coursesFulfilled = totalCredits >= reqData.required_credits;
        } else if (reqData.type === 'some_courses') {
            coursesFulfilled = Object.values(reqData.groups).every(group => 
                group.some(course => {
                    const isCourseCompleted = completedCourses.some(completedCourse => completedCourse.courseID === course.CourseID);
                    const isCourseSelected = selectedCourses.some(selectedCourse => selectedCourse.CourseID === course.CourseID);
                    if (isCourseSelected || isCourseCompleted) {
                        const courseLi = reqDiv.querySelector(`[data-course-id="${course.CourseID}"]`);
                        if (courseLi) {
                            courseLi.classList.add('completed-course');
                        }
                    }
                    return isCourseCompleted || isCourseSelected;
                })
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
    semesterRow.id = `${semesterTerm}-${semesterYear}-row`

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
    addCourseButton.id = `add-course-${semesterTerm}-${semesterYear}`;
    addCourseButton.setAttribute('onclick', `addCourseBox('${semesterTerm}', ${semesterYear})`);
    addCourseButton.textContent = '+';
    semester.appendChild(addCourseButton);
    
    semesterRow.appendChild(semester);
    semesterRows.appendChild(semesterRow);

    updateSemesterDropdown();
    

    const skipButton = document.getElementById('skip-button');

    if(semesterTerm === 'SP'){
        addSpringButtons();
    } else if (skipButton){
        removeSpringButtons();
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

function addSpringButtons(){
    const semesterBtnDiv = document.getElementById('add-semester-div');
    const skipSummerButton = document.createElement('button');
    skipSummerButton.onclick = () => skipSummer();
    skipSummerButton.textContent = 'Skip Summer';
    skipSummerButton.id = 'skip-button'
    

    const internShipBtn = document.createElement('button');
    internShipBtn.onclick = () => addInternship();
    internShipBtn.textContent = 'Summer Internship';
    internShipBtn.id = 'internship-button'
    
    semesterBtnDiv.appendChild(internShipBtn);
    semesterBtnDiv.appendChild(skipSummerButton);
}

function removeSpringButtons(){
    const skipButton = document.getElementById('skip-button');
    const internshipButton = document.getElementById('internship-button');
    const semesterBtnDiv = document.getElementById('add-semester-div');
    semesterBtnDiv.removeChild(skipButton);
    semesterBtnDiv.removeChild(internshipButton);
}


function addInternship(){

    const semesterTerm = 'SU';
    const semesterYear = semesterNum;

    const internship = {
        CourseID: 'Internship',
        semester: 'SU',
        year: semesterYear
    }
    selectedCourses.push(internship);

    //Gets div that houses all semesters
    const semesterRows = document.getElementById('semester-rows');

    // Creates semester row divider 
    const semesterRow = document.createElement('div');
    semesterRow.classList.add('semester-row');
    semesterRow.id = `${semesterTerm}-${semesterYear}-row`

    // Creates header for semester row 
    const header = document.createElement('h3');
    header.id = `${semesterTerm} ${semesterYear}`
    header.textContent = `${semesterTerm} ${semesterYear}: Summer Internship`;
    semesterRow.appendChild(header);

    // Creates semester divider
    const semester = document.createElement('div');
    semester.classList.add('semester');
    semester.id = `${semesterTerm}-${semesterYear}`

    
    semesterRow.appendChild(semester);
    semesterRows.appendChild(semesterRow);
    
    //Creates Big Text saying summer internship 
    addInternshipText(`${semesterTerm}`, semesterYear);

    removeSpringButtons();

    semesterCount = 0;

}

function addInternshipText(semesterTerm, semesterYear){
    const semester = document.getElementById(`${semesterTerm}-${semesterYear}`);
    const addCourseButton = document.getElementById(`add-course-${semesterTerm}-${semesterYear}`)
    if(addCourseButton){
        const header = document.getElementById(`${semesterTerm} ${semesterYear}`);
        header.textContent = `${semesterTerm} ${semesterYear}: Summer Internship`;
        semester.removeChild(addCourseButton);
    }
    
    const summerInternshipText = document.createElement('strong');
    summerInternshipText.id = `SU-${semesterYear} Internship`;
    summerInternshipText.textContent = 'Summer Internship';
    semester.appendChild(summerInternshipText);

}

/*
Function to delete semester row
*/
async function removeSemester() {
    
    const semesterRows = document.getElementById('semester-rows');
    
    // Check if there are any semester rows to remove
    if (semesterRows.children.length === 0) {
        alert("No semesters to remove.");
        return;
    }

    let lastSemesterRow = semesterRows.lastElementChild;
    const lastSemester = lastSemesterRow.querySelector('.semester');
    const semesterId = lastSemester.id;
    const semesterTerm = semesterId.slice(0, 2);  // Get the first 2 characters
    const semesterYear = semesterId.slice(-2);    // Get the last 2 characters

    // Remove all courses in the semester
    const ableToRemove = await removeAllCourses(semesterTerm, semesterYear);
    
    if (!ableToRemove) {
        return;
    }

    // Remove the last semester row
    if(lastSemesterRow.id.indexOf('SP') != -1){
        removeSpringButtons();
        semesterCount = 1;
    } else if (lastSemesterRow.id.indexOf('AU') != -1){
        semesterNum--;
        semesterCount = 0;
    } else {
        semesterCount = 2;
    }
    
    // Remove course boxes inside the semester 
    const courseBoxes = lastSemester.querySelectorAll('.course-box'); 
  
    courseBoxes.forEach(courseBox => {    
        const courseID = courseBox.firstChild.value;
        selectedCourses = selectedCourses.filter(course => !(course.CourseID == courseID && course.year === semesterNum && course.semester === semesterTerm)); 
    });

    if(lastSemester.lastElementChild.id === `SU-${semesterNum} Internship`){
        selectedCourses = selectedCourses.filter(course => !(course.CourseID === 'Internship' && course.year === semesterNum));
    }

    semesterRows.removeChild(lastSemesterRow);

    if(semesterRows.lastElementChild){
        if(semesterRows.lastElementChild.id.indexOf('SP') != -1){
            addSpringButtons();
        }
    } 

    updateSemesterDropdown();
}

/*
Function for updating semester drop down for manual coure addition
*/
function updateSemesterDropdown() {
    const manualSemesterSelect = document.getElementById('manualSemesterSelect');
    manualSemesterSelect.innerHTML = ''; // Clear existing options

    const semesterRows = document.getElementById('semester-rows');
    const semesterDivs = semesterRows.getElementsByClassName('semester-row');

    Array.from(semesterDivs).forEach(semesterDiv => {
        const header = semesterDiv.querySelector('h3');
        const option = document.createElement('option');
        option.value = header.id;
        option.textContent = header.id;
        manualSemesterSelect.appendChild(option);
    });
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
    selectList.dataset.firstSelected = 'false';
    
    //Creates first option for list
    const option = document.createElement('option');
    option.textContent = "Click to Select Course";
    selectList.appendChild(option);

    // Filters courses based on requirements
    const filteredCourses = courseData.filter(course => {
        return Object.values(requirementsData).some(req => {
            if (req.type === 'credit_hours' || req.type === 'all_courses') {
                return req.courses.some(reqCourse => reqCourse.CourseID === course.CourseID);
            } else if (req.type === 'some_courses') {
                return Object.values(req.groups).some(group => group.some(reqCourse => reqCourse.CourseID === course.CourseID));
            }
            return false;
        });
    });


    //Loops through each course in courseData and adds them to list, specifiying course prerequisites in dataset
    for (const course of filteredCourses){
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
        if(!filteredCourses.some(course => course.CourseID == courseID)){
            const selectedCourse = courseData.find(course => course.CourseID === courseID);
            const option = document.createElement('option');
            option.value = selectedCourse.CourseID;
            option.textContent = `${selectedCourse.CourseID} - ${selectedCourse.CourseName} - Manually Added`;
            option.dataset.prerequisites = JSON.stringify(selectedCourse.prerequisites)
            selectList.appendChild(option);
        }
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
        if(!loadingSchedule && selectElement.dataset.firstSelected === 'true'){
            await removeSelectedCourse(courseBoxID, semesterTerm, semesterNum);
        }
        await checkAndAddCourse(selectElement, semesterTerm, semesterNum, courseBoxID);
    }
}

/*
Function for adding course manually
*/
async function addManualCourse() {
    const courseId = document.getElementById('manualCourseInput').value;
    const selectedSemester = document.getElementById('manualSemesterSelect').value;

    if (!selectedSemester) {
        alert('Please select a semester.');
        return;
    }

    const [semesterTerm, semesterYear] = selectedSemester.split(' ');

    // Fetch course data based on the entered course ID
    const response = await fetch(`/api/course/${courseId}`);
    if (!response.ok) {
        alert('Invalid course ID or course not found.');
        return;
    }

    const course = await response.json();

    if (!course) {
        alert('Invalid course ID or course not found.');
        return;
    }

    // Check if the course is already selected
    if (selectedCourses.some(c => c.CourseID === course.CourseID)) {
        alert('Course already selected.');
        return;
    }


    // Add the course to the UI (you can reuse addCourseBox logic if needed)
    addCourseBox(semesterTerm, parseInt(semesterYear), course.CourseID);
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
    
    //message modal and text
    const modal = document.getElementById('messageModal');
    const modalMessage = document.getElementById('message');
    const modalDiv = document.getElementById('messageDiv');
    
    //Get selected course 
    const selectedCourseID = selectElement.value;
    const selectedCourse = courseData.find(course => course.CourseID === selectedCourseID);
    const newSelectedCourseInstance = {
        CourseID: selectedCourse.CourseID,
        CourseName: selectedCourse.CourseName,
        prerequisites: selectedCourse.prerequisites,
        Credits: selectedCourse.Credits,
    }

    //Check if total credit hours less than 18 
    header = document.getElementById(`${semesterTerm} ${semesterNum}`);
    if (parseFloat(header.dataset.credits) + selectedCourse.Credits > 18){
        selectElement.value = "Click to Select Course"; // Reset selection
        modalMessage.textContent = 'Cannot add course: exceeds 18 credit hour limit';
        modalDiv.innerHTML = ''
        openModal(modal);
        return;
    }


    //Converts semester and year into value that can be compared 
    const currentSemesterValue = convertToComparableValue(semesterTerm, semesterNum);

    //Checks if course is already selected in the semester
    const alreadySelected = checkSemesterForCourse(currentSemesterValue, selectedCourseID)
    if(alreadySelected){
        selectElement.value = "Click to Select Course"; // Reset selection
        modalMessage.textContent = 'Cannot add course: Already selected in semester';
        modalDiv.innerHTML = ''
        openModal(modal);
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
            selectElement.value = "Click to Select Course"; // Reset selection
            modalMessage.textContent = `You have not met the prerequisites for ${selectedCourseID}`;
            displayPrerequisites(selectedCourseID, modalDiv)
            openModal(modal);
            return;
        }
    }

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
            newSelectedCourseInstance.semester = `${semesterTerm}`;
            newSelectedCourseInstance.year = semesterNum;
            selectedCourses.push(newSelectedCourseInstance)

            selectElement.value = selectedCourseID;

            header = document.getElementById(`${semesterTerm} ${semesterNum}`);
            header.dataset.credits = parseFloat(header.dataset.credits) + selectedCourse.Credits;
            header.textContent = `${semesterTerm} ${semesterNum}: ${header.dataset.credits} Credit Hours`;

            selectElement.dataset.firstSelected = 'true';

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
    let courseID = 'CSE XXXX';
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
        if(course){
            courseID = course.courseID; 
            credits = course.credits;
        }

    } catch (e) {
        console.error('Error getting courseID: ', e);
        alert('Error removing course. Please try again.');
        return;
    }

    if(courseID === 'CSE XXXX'){
        console.error('No Course Found')
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
            selectedCourses = selectedCourses.filter(course => !(course.CourseID === courseID && course.year === semesterNum && course.semester === semesterTerm)); 
            const header = document.getElementById(`${semesterTerm} ${semesterNum}`);

            // Null check before accessing header's properties
            if (header) {
                header.dataset.credits = parseFloat(header.dataset.credits) - credits;
                header.textContent = `${semesterTerm} ${semesterNum}: ${header.dataset.credits} Credit Hours`;
            }

            updateRequirementFulfillment();
        } else {
            const e = await response.json();
            console.error('Error removing course 1:', e);
            alert('Error removing course. Please try again.');
        }

    } catch (e) {
        console.error('Error removing course 2: ', e);
        alert('Error removing course. Please try again.');
    }


}

/*
Function that removes all courses at once when remove semester is pressed
*/
async function removeAllCourses(semesterTerm, semesterYear) {
    const removeCoursesPayload = {
        semester: semesterTerm,
        year: semesterYear
    };

    try {
        const response = await fetch('/api/remove_all_courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(removeCoursesPayload)
        });

        if (response.ok) {
            return true;
        } else {
            const error = await response.json();
            console.error('Error removing all courses:', error);
            alert('Error removing all courses. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Error removing all courses:', error);
        alert('Error removing all courses. Please try again.');
        return false;
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
    if (scheduleId > 0) {
        const loadedScheduleModal = document.getElementById('loadedScheduleModal');
        openModal(loadedScheduleModal);
    } else {
        const saveScheduleModal = document.getElementById('saveScheduleModal');
        openModal(saveScheduleModal);
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

async function createNewSchedule(scheduleName) {

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
Function to log out the user
*/
function logout() {
    window.location.href = '/logout';
}

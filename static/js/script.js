// script.js
let semesterCount = 0;
let semesterNum = 24;
let selectedCourses = [];
let courseData = [];
let completedCourses = [];
let requirementsData = {};
const scheduleId = parseInt(document.getElementById('schedule-id').value);
const selectListDict = {}

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
    courseInputEventListeners();
    fetchAllData();
});

function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow a drop
    e.dataTransfer.dropEffect = 'move';
}

async function handleDrop(e) {
    e.preventDefault();
    const courseId = e.dataTransfer.getData('text/plain');
    const semesterId = e.target.id;
    const semesterTerm = semesterId.split('-').slice(-2)[0];
    const semesterYear = semesterId.split('-').slice(-1)[0];
    
    if (courseId && semesterId) {
        await addCourseBox(semesterTerm, parseInt(semesterYear), courseId);
    }
}

function courseInputEventListeners(){
    const prereqInput = document.getElementById('courseIDInput')
    const manualCourseInput = document.getElementById('manualCourseInput')
    prereqInput.addEventListener("keyup", (e) =>{
        // If input value is longer or equal than 4 chars shows courses 
        if (e.target.value.length >= 4) {
            prereqInput.setAttribute("list", "manualCourseDataList");
        } else {
            prereqInput.setAttribute("list", "");
        }
    });

    manualCourseInput.addEventListener("keyup", (e) =>{
        // If input value is longer or equal than 3 chars shows courses 
        if (e.target.value.length >= 3) {
            manualCourseInput.setAttribute("list", "manualCourseDataList");
        } else {
            manualCourseInput.setAttribute("list", "");
        }
    });
}

function populateCourseSelectOptions() {
    const selectElement = document.getElementById('manualCourseDataList');

    const option = document.createElement('option');
    option.textContent = "Click to Select Course";
    selectElement.appendChild(option);

    courseData.forEach(course => {
        const option = document.createElement('option');
        option.value = course.CourseID;
        option.textContent = `${course.CourseID} - ${course.CourseName}`;
        selectElement.appendChild(option);
    });
}

async function fetchAllData() {

    const waitModal = document.getElementById('waitModal');
    openModal(waitModal);

    const scheduleId = parseInt(document.getElementById('schedule-id').value);
    await fetchCourseData();

    populateCourseSelectOptions();
    await fetchUserData();

    await fetchRequirementsData();

    if (scheduleId > 0){
        await loadSavedSchedule(scheduleId);
    } else {
        closeModal(waitModal);
    }

    updateRequirementFulfillment();
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


    //When course id is inputted it will make sure there is a course id present and display the prerequistes
    submitBtn.onclick = function() {
        const courseId = document.getElementById('courseIDInput').value;
        console.log(courseId);
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
        console.log(completedCourses)

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
        prof = document.getElementById('prof').value;
        const response = await fetch(`/api/requirements`);
        const requirements = await response.json();

        if(prof != 'None'){
            const response = await fetch(`/api/prof-requirements`)
            const profReq = await response.json();
            requirementsData = Object.assign({}, profReq, requirements)
        } else {
            requirementsData = requirements;
        }

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

    const groupRequirements = (requirements) => {
        const foundations = {};
        const themes = {};
        const otherRequirements = {};

        for (const [reqName, reqData] of Object.entries(requirements)) {
            if (reqName.includes('Foundations')) {
                foundations[reqName] = reqData;
            } else if (reqName.includes('Themes')) {
                themes[reqName] = reqData;
            } else {
                otherRequirements[reqName] = reqData;
            }
        }

        return { foundations, themes, otherRequirements };
    };

    const createGroupedSection = (sectionName, sectionData) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'requirement';
        sectionDiv.id = `requirement-group-${sectionName}`
        const sectionHeader = document.createElement('h4');
        sectionHeader.textContent = sectionName;
        sectionHeader.classList.add('requirement-header');
        sectionDiv.appendChild(sectionHeader);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'requirement-content';
        contentDiv.style.display = 'none'; // Initially hide the content

        for (const [reqName, reqData] of Object.entries(sectionData)) {
            const reqDiv = createRequirementDiv(reqName, reqData);
            contentDiv.appendChild(reqDiv);
        }

        sectionDiv.appendChild(contentDiv);
        sectionHeader.addEventListener('click', () => {
            contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
        });

        requirementsDiv.appendChild(sectionDiv);
    };

    const createRequirementDiv = (reqName, reqData) => {
        const reqDiv = document.createElement('div');
        reqDiv.className = 'requirement';
        reqDiv.id = `requirement-${reqName.replace(/ /g, '-')}`;

        const header = document.createElement('h4');
        header.textContent = reqName;
        header.classList.add('requirement-header');
        reqDiv.appendChild(header);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'requirement-content';

        if (reqData.type === 'some_courses') {
            appendGroupCourses(contentDiv, reqData.groups);
        } else if (reqData.type === 'credit_hours' && reqData.course_prefix && reqData.min_course_number && reqData.max_course_number) {
            fetchCoursesInRange(reqData.course_prefix, reqData.min_course_number, reqData.max_course_number).then(courses => {
                reqData.courses = courses;
                header.textContent += ` - Complete ${reqData.required_credits} Credit Hours`;
                const dynamicCoursesBtn = createDynamicCoursesButton(courses);
                contentDiv.appendChild(dynamicCoursesBtn);
            });
        } else if (reqData.type === 'credit_hours') {
            header.textContent += ` - Complete ${reqData.required_credits} Credit Hours`;
            if (reqData.courses.length > 10){
                const courseBtn = createDynamicCoursesButton(reqData.courses);
                contentDiv.appendChild(courseBtn);
            } else {
                appendCoursesList(contentDiv, reqData.courses);
            }
        } else {
            if (reqData.courses.length > 10){
                const courseBtn = createDynamicCoursesButton(reqData.courses);
                contentDiv.appendChild(courseBtn);
            } else {
                appendCoursesList(contentDiv, reqData.courses);
            }
        }

        contentDiv.style.display = 'none'; // Initially hide the content
        reqDiv.appendChild(contentDiv);

        header.addEventListener('click', () => {
            contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
        });

        return reqDiv;
    };

    const appendGroupCourses = (contentDiv, groups) => {
        for (const [group, courses] of Object.entries(groups)) {
            const groupHeader = document.createElement('h5');
            groupHeader.textContent = `Group ${group} - Select 1 from this group`;
            // groupHeader.classList.add('requirement-header');
            contentDiv.appendChild(groupHeader);

            const ul = document.createElement('ul');
            if (courses.length > 10){
                const courseBtn = createDynamicCoursesButton(courses);
                ul.appendChild(courseBtn);
            } else {
                appendCoursesList(ul, courses);
            }
            contentDiv.appendChild(ul);

        }
    };

    const createDynamicCoursesButton = (courses) => {
        const dynamicCoursesBtn = document.createElement('button');
        dynamicCoursesBtn.textContent = 'View Eligible Courses';
        dynamicCoursesBtn.onclick = () => {
            const modal = document.getElementById('validCoursesModal');
            const validCourses = document.getElementById('validCourses');
            validCourses.innerHTML = '';
            appendCoursesList(validCourses, courses);
            openModal(modal);
        };
        return dynamicCoursesBtn;
    };

    const appendCoursesList = (parentElement, courses) => {
        const ul = document.createElement('ul');
        courses.forEach(course => {
            const li = document.createElement('li');
            li.textContent = `${course.CourseID} - ${course.CourseName} (${course.Credits} Credits)`;
            li.setAttribute('data-course-id', course.CourseID); // Unique identifier
            li.style.cursor = 'pointer'; // Change cursor to pointer
            li.draggable = true; // Make the item draggable
    
            // Add drag event listeners
            li.addEventListener('dragstart', handleDragStart);
    
            ul.appendChild(li);
    
            const prereqHeader = document.createElement('h4');
            prereqHeader.style.marginLeft = '20px'; // Indent the header
            prereqHeader.style.display = 'none'; // Initially hide the header
            prereqHeader.style.color = '#595959'; // Grey text color
            li.appendChild(prereqHeader);
    
            const prereqList = createPrerequisiteList(course.CourseID);
            prereqList.style.marginLeft = '20px'; // Indent the prerequisites
            prereqList.style.marginBottom = '10px';
            prereqList.style.color = '#595959'; // Grey text color
            li.appendChild(prereqList);
    
            li.addEventListener('click', function() {
                const isHidden = prereqList.style.display === 'none';
                prereqHeader.style.display = isHidden ? 'block' : 'none';
                prereqList.style.display = isHidden ? 'block' : 'none';
    
                if (isHidden) {
                    li.style.fontWeight = 'bold';
                } else {
                    li.style.fontWeight = 'normal';
                }
    
                ul.querySelectorAll('li').forEach(item => {
                    if (item !== li) {
                        item.style.fontWeight = 'normal';
                    }
                });
            });
        });
        parentElement.appendChild(ul);
    };
    
    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.getAttribute('data-course-id'));
    }
    

    const { foundations, themes, otherRequirements } = groupRequirements(requirementsData);

    if (Object.keys(foundations).length > 0) {
        createGroupedSection('Foundations', foundations);
    }

    if (Object.keys(themes).length > 0) {
        createGroupedSection('Themes', themes);
    }

    for (const [reqName, reqData] of Object.entries(otherRequirements)) {
        const reqDiv = createRequirementDiv(reqName, reqData);
        requirementsDiv.appendChild(reqDiv);
    }
}

function createPrerequisiteList(courseID) {
    const course = courseData.find(c => c.CourseID === courseID);
    const prereqList = document.createElement('ul');
    prereqList.style.display = 'none'; // Initially hide the list

    if (course && course.prerequisites) {
        course.prerequisites.forEach(prereq => {
            const prereqItem = document.createElement('li');
            prereqItem.textContent = `${prereq.prerequisiteID}`;
            prereqList.appendChild(prereqItem);
        });
    }

    return prereqList;
}

/* 
function to create prerequisite list 
*/
function createPrerequisiteList(courseId) {
    const course = courseData.find(course => course.CourseID === courseId);
    const prereqList = document.createElement('ul');
    prereqList.style.display = 'none'; // Initially hide the prerequisites list

    if (course) {
        const prerequisites = course.prerequisites.filter(req => req.type === 'prerequisite');
        
        if (prerequisites.length === 0) {
            const noPrereqs = document.createElement('li');
            noPrereqs.textContent = 'No Prerequisites';
            prereqList.appendChild(noPrereqs);
        } else {
            // Add prerequisites header under the course item
            const prereqHeader = document.createElement('h4');
            prereqHeader.textContent = 'Prerequisites - Select 1 from each group:';
            prereqHeader.style.color = '#595959'; // Grey text color
            prereqHeader.style.display = 'block'; // Display the header
            prereqList.appendChild(prereqHeader);

            const groups = {};
            prerequisites.forEach(req => {
                if (!groups[req.group]) {
                    groups[req.group] = [];
                }
                groups[req.group].push(req.prerequisiteID);
            });

            for (const group in groups) {
                const groupElem = document.createElement('li');
                const groupPrereqs = groups[group];
                groupElem.textContent = `Group ${group}: ${groupPrereqs.join(', ')}`;
                prereqList.appendChild(groupElem);
            }
        }
    } else {
        const noCourse = document.createElement('li');
        noCourse.textContent = 'Course not found.';
        prereqList.appendChild(noCourse);
    }

    return prereqList;
}


/*
Function to update requirements section 
*/
function updateRequirementFulfillment() {
    let foundationsCount = 0
    let themeCount = 0
    for (const [reqName, reqData] of Object.entries(requirementsData)) {
        const reqDiv = document.getElementById(`requirement-${reqName.replace(/ /g, '-')}`);
        let coursesFulfilled = false;

        // Remove the completed-course class from all courses
        const courseLis = reqDiv.querySelectorAll('li[data-course-id]');
        courseLis.forEach(courseLi => {
            courseLi.classList.remove('completed-course');
        });

        if (reqData.type === 'all_courses') {
            
            //Check every course and not just return false when 1 course not met
            coursesFulfilled = reqData.courses.reduce((accumulator, course) => {
                const isCourseCompleted = completedCourses.some(completedCourse => completedCourse.courseID === course.CourseID);
                const isCourseSelected = selectedCourses.some(selectedCourse => selectedCourse.CourseID === course.CourseID);
                if (isCourseSelected || isCourseCompleted) {
                    const courseLi = reqDiv.querySelector(`[data-course-id="${course.CourseID}"]`);
                    if (courseLi) {
                        courseLi.classList.add('completed-course');
                    }
                }
                return accumulator && (isCourseCompleted || isCourseSelected); // Accumulate the result
            }, true);
        } else if (reqData.type === 'credit_hours') {
            const totalCredits = reqData.courses.reduce((sum, course) => {
                const isCourseCompleted = completedCourses.some(completedCourse => completedCourse.courseID === course.CourseID);
                
                // Count occurrences of the course in the selectedCourses array
                const selectedOccurrences = selectedCourses.filter(selectedCourse => selectedCourse.CourseID === course.CourseID).length;
            
                if (selectedOccurrences > 0 || isCourseCompleted) {
                    const courseLi = reqDiv.querySelector(`[data-course-id="${course.CourseID}"]`);
                    if (courseLi) {
                        courseLi.classList.add('completed-course');
                    }
                }
                
                // Add credits for each instance of the selected course
                if (isCourseCompleted) {
                    return sum + course.Credits;
                }
                if (selectedOccurrences > 0) {
                    return sum + (course.Credits * selectedOccurrences);
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

            if (reqName.includes('Foundations')) {
                foundationsCount++;
                foundationsGroupDiv = document.getElementById('requirement-group-Foundations');
                if(foundationsCount == foundationsGroupDiv.children[1].children.length){
                    foundationsGroupDiv.classList.add('fulfilled');
                }
            } else if (reqName.includes('Themes')) {
                themeCount++;
                themesGroupDiv = document.getElementById('requirement-group-Themes');
                if(themeCount == themesGroupDiv.children[1].children.length){
                    themesGroupDiv.classList.add('fulfilled');
                }
            }


        } else {
            reqDiv.classList.remove('fulfilled');

            if (reqName.includes('Foundations')) {
                foundationsCount--;
                foundationsGroupDiv = document.getElementById('requirement-group-Foundations');
                foundationsGroupDiv.classList.remove('fulfilled');
            } else if (reqName.includes('Themes')) {
                themeCount--;
                themesGroupDiv = document.getElementById('requirement-group-Themes');
                themesGroupDiv.classList.remove('fulfilled');
            }
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
    semester.addEventListener('dragover', handleDragOver);
    semester.addEventListener('drop', handleDrop);
    
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
    const credits = parseFloat(document.getElementById(`${semesterTerm} ${semesterYear}`).dataset.credits);

    
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
    updateRequirementFulfillment();

    const totalCreditsHeader = document.getElementById(`totalCredits`);
    totalCreditsHeader.dataset.credits = parseFloat(totalCreditsHeader.dataset.credits) - credits;
    totalCreditsHeader.textContent = `Total Credit Hours: ${totalCreditsHeader.dataset.credits}`;
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
   
    // Check if the course is already selected in this semester, so drag and drop feature doesnt create box if course already in 
    if (selectedCourses.some(course => course.CourseID === courseID && course.semester === semesterTerm && course.year === semesterNum)) {
        alert('Course already selected in this semester.');
        return;
    }
    
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

    // Initialize Select2 on the newly added course select element
    var options = {searchable: true, placeholder: 'Select Classes', searchtext: 'Start typing to search for class'}
    newSelect = NiceSelect.bind(selectList, options)
    selectListDict[selectList.id] = newSelect

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
        newSelect.update();

    }


}

/*
When course selection is changed, changes database and lists accordingly
*/
async function courseChange(selectElement, semesterTerm, semesterNum, courseBoxID){

    selectInstance = selectListDict[selectElement.id];

    if (selectElement.value == "Click to Select Course"){
        await removeSelectedCourse(courseBoxID, semesterTerm, semesterNum);
    } else {
        if(!loadingSchedule && selectElement.dataset.firstSelected === 'true'){
            await removeSelectedCourse(courseBoxID, semesterTerm, semesterNum);
        }
        await checkAndAddCourse(selectElement, semesterTerm, semesterNum, courseBoxID);
    }

    selectInstance.update();

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

    //Checks if course is already selected in the semester (skipping general education courses)
    if(selectedCourse.CourseID.indexOf('Credit Hour') == -1){
        const alreadySelected = checkSemesterForCourse(currentSemesterValue, selectedCourseID)
        if(alreadySelected){
            selectElement.value = "Click to Select Course"; // Reset selection
            modalMessage.textContent = 'Cannot add course: Already selected in semester';
            modalDiv.innerHTML = ''
            openModal(modal);
            return;
        }
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

            const header = document.getElementById(`${semesterTerm} ${semesterNum}`);
            header.dataset.credits = parseFloat(header.dataset.credits) + selectedCourse.Credits;
            header.textContent = `${semesterTerm} ${semesterNum}: ${header.dataset.credits} Credit Hours`;


            const totalCreditsHeader = document.getElementById(`totalCredits`);
            totalCreditsHeader.dataset.credits = parseFloat(totalCreditsHeader.dataset.credits) + selectedCourse.Credits;
            totalCreditsHeader.textContent = `Total Credit Hours: ${totalCreditsHeader.dataset.credits}`;

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

        if (response.status == 404){
            return;
        }

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

            const totalCreditsHeader = document.getElementById(`totalCredits`);
            totalCreditsHeader.dataset.credits = parseFloat(totalCreditsHeader.dataset.credits) - credits;
            totalCreditsHeader.textContent = `Total Credit Hours: ${totalCreditsHeader.dataset.credits}`;

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

import requests
from bs4 import BeautifulSoup
import re

url = 'https://cse.osu.edu/courses?field_subject_target_id=All&field_campus_target_id=All&field_academic_career_target_id=133&field_level_target_id=All'

reponse = requests.get(url)
html_content = reponse.content

soup = BeautifulSoup(html_content, 'html.parser')

def extract_prereqs(container):
    prereq_section = re.search(r'(Prereq|Concur):(.*?)(Units:|$)', container).group().strip()
    print(prereq_section)

    # Categorize the prerequisites
    prereq_patterns = {
        'Not open to students': r'Not open to students with credit for (.*?)(\.|Prereq|$)',
        'Prereq or concur': r'Prereq or concur: (.*?)(\.|Prereq|$)',
        'All of': r'Prereq: ((?:\d+,? ?)+ and (?:\d+,? ?)+.*?)(\.|Prereq|$)',
        'One of': r'Prereq: (.*?)(\.|Prereq|$)',
        'Concur': r'Concur: (.*?)(\.|Prereq|$)',
    }

    parsed_prereqs = {
        'not_open_to_students': [],
        'prereq_or_concur': [],
        'all_of': [],
        'one_of': [],
        'concur': [],
        'prereq': []
    }

    for key, pattern in prereq_patterns.items():
        match = re.search(pattern, prereq_section)
        if match:
            if key == 'Not open to students':
                parsed_prereqs['not_open_to_students'] = match.group(1).strip()
            elif key == 'Prereq or concur':
                parsed_prereqs['prereq_or_concur'] = match.group(1).strip().split(', ')
            elif key == 'All of':
                parsed_prereqs['all_of'] = match.group(1).strip().split(' and ')
            elif key == 'One of':
                parsed_prereqs['one_of'] = match.group(1).strip().split(', ')
            elif key == 'Concur':
                parsed_prereqs['concur'] = match.group(1).strip().split(', ')
    
    # Additional parsing for standalone Prereq without specific keywords
    if not parsed_prereqs['all_of'] and not parsed_prereqs['one_of']:
        match = re.search(r'Prereq: (.*?)(\.|Prereq|$)', container)
        if match:
            parsed_prereqs['prereq'].extend([pr.strip() for pr in match.group(1).split(', ')])
    
    return parsed_prereqs


# Find the container that holds the course information
# Inspect the webpage to find the exact tags and classes
course_containers = soup.find_all('div', class_='content-body accordion-panel closed')

# Extract and print course details
courses = []
for container in course_containers:
    course_name = container.find('span', class_='title').text.strip()
    course_id = container.find('span', class_='number').text.strip("()")
    course_credits = container.find('span', string='Units:').next_sibling.strip()
    course_credits = int(float(course_credits))

    if container.find('br'):

        if re.search(r'Repeatable(.*?)(Units:|$)', container.find('br').next_sibling.strip()):
            continue

        prereqs = extract_prereqs(container.find('br').next_sibling.strip())
    else:
        prereqs = {
            'not_open_to_students': [],
            'prereq_or_concur': [],
            'all_of': [],
            'one_of': [],
            'concur': [],
            'prereq': []
        }


    course = {
        'id': course_id,
        'name': course_name,
        'credits': course_credits,
        'prereqs': prereqs
    }
    courses.append(course)


# Print the extracted data
# for course in courses:
#     print(f"Course ID: {course['id']}")
#     print(f"Course Name: {course['name']}")
#     print(f"Credits: {course['credits']}")
#     print(f"Not open to students: {course['prereqs']['not_open_to_students']}")
#     print(f"Prereq or concur: {course['prereqs']['prereq_or_concur']}")
#     print(f"Concur: {course['prereqs']['concur']}")
#     print(f"All of: {course['prereqs']['all_of']}")
#     print(f"One of: {course['prereqs']['one_of']}")
#     print(f"Prereq: {course['prereqs']['prereq']}")
#     print("-" * 20) 
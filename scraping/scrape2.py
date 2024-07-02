import requests
from bs4 import BeautifulSoup
import re

url = 'https://cse.osu.edu/courses?field_subject_target_id=All&field_campus_target_id=All&field_academic_career_target_id=133&field_level_target_id=All'

reponse = requests.get(url)
html_content = reponse.content

soup = BeautifulSoup(html_content, 'html.parser')


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

    course = {
        'id': "CSE " + course_id,
        'name': course_name,
        'credits': course_credits,
    }
    courses.append(course)


# Print the extracted data
for course in courses:
    print(f"Course ID: {course['id']}")
    print(f"Course Name: {course['name']}")
    print(f"Credits: {course['credits']}")
    print("-" * 20) 


import mysql.connector
connection = mysql.connector.connect(
    host="localhost",
    database='CSE',
    user="root",
    password="Bhayyaz2006!"
)
cursor = connection.cursor(dictionary=True)
for course in courses:
    cursor.execute('''
        INSERT INTO courses (CourseID, CourseName, Credits)
        VALUES (%s, %s, %s)
    ''', (course['id'], course['name'], course['credits']))
    connection.commit()

connection.close()

# cursor = connection.cursor(dictionary=True)
# for course in courses:
#     cursor.execute('''
#         DELETE FROM courses WHERE CourseID=%s AND Credits=%s
#     ''', (course['id'], course['credits']))
#     connection.commit()

# connection.close()

print('Done')
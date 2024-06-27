import mysql.connector

#Database connection function 
def get_db_connection(database):
    connection = mysql.connector.connect(
        host="34.162.95.182",
        database=database,
        user="root",
        password="OSUDEGREEPLAN!"
    )
    return connection

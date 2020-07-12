# Hermes Messenger (DBMS Project)
## Screenshots of the Web App
1. Login page. 
![login](/screenshots/image2.png). 
  
2. Regitration page. 
![register](/screenshots/image10.png).

3. Chat room page. 
![chat](/screenshots/image3.png). 

4. User details. 
![user](/screenshots/image4.png). 


## Backend 
### Setting up database
1. open the psql_setup.sql file and put in your password for the admin user
2. run the psql_setup.sql script in psql by ```psql -f psql_setup.sql```
3. setup the database credentials in the .env file
4. run the setup.js file ```node setup.js```
### Loggers
* there are two loggers made using winston:
    * serverLog
    * dbLog
* serverLog logs to the console and the server.log file. it creates a log file if it doesn't exist
* dbLog logs only to the db.Log file.
* use serverLog to log any server related messages
* use dbLog to log database related messages
#### Usage
* the levels can be:

    |level    | priority|
    |---------|---------|
    |error    |    0    |
    |warn     |    1    |
    |info     |    2    |

# Aerosource

## Overview
This project is building using Java Spring 4.1 Framework connecting to a SQL database (currently MySQL), along with AngularJS 1.3 for embedding dynamic responsive content into the front-end.

## Minimum System Requirements

This project has been tested and working stable on a Linux Virtual Private Server (VPS) with 1 Intel Xeon 2.0GHz CPU,  1024MB memory, and 1GB harddrive swap (recommended 1.5GB memory or more to not rely on swap), and only has a footprint of 60MBs (database and application) currently.

This has been verified to compile and run on a Windows server as well. If running on a Windows server, the above specs should be increased slightly as a Windows environment requires more resources.

The application is currently configured to run on a MySQL database, but the connector library (according to the spec) is capable of running on SQL Server. Testing and configuration have been added to a future phase.

<!--
author=test
img=4.jpg
tags=test,post
-->

## Preliminary Setup and Configuration

---
#### Windows:
Install the latest Java 7 JDK version (Java 8 is strongly recommended by Oracle), or JRE if only running the app and not compiling. To verify the version, open command prompt and run the following:

```
java -v
```

Install MySQL Server and create the "aerocanada" database. Once created, import the database contained in the project archive under <PROJECT_ROOT>/database_setup.

The database configuration is done via Java Beans and is found in src\main\java\com\cantango\AppConfiguration.java
By default it is configured to connect to a MySQL database running on the same server (listening on localhost) at the defaul 3306 port. It is currently configured to use the default root:root credentials to login. All these parameters can be configured via the DataSource class in this file prior to compilation.

---
## Building
---
#### Windows:
Extract all the code to a specific folder in which the build will occur. Open a command prompt terminal and navigate to the root of the extracted project (same directory level which contains this file). In the terminal execute the following command:
```
gradlew.bat build
```
This will build the executable jar and place it in <PROJECT ROOT>\build\libs. This jar will contain all the front-end (HTML, CSS, JS), and back-end (Java classes) needed to run the server. Once in the same folder, you can execute the Jar by executing the following command:
```
java -jar AeroCanada-8.0.0.jar
```
To verify that it is running, open a browser and navigate to http://localhost:8080
To have this run in the background, it will need to be setup as a service in the Windows OS.

---
## Developer Guide
---
#### Intellij Idea Project Setup
Extract code to the desired folder.
Open Intellij and select import project.
Select the project root "AeroCanada" as the import.
On the following screen select Import from Gradle project.

#### Eclipse Project Setup
Extract code to the desired folder.
Install the Eclipse Gradle plugin.
Open Eclipse and import the project.

---
## Production Application Setup
---
#### User Setup
Create a new VPS running the latest LTS version of Ubuntu.
SSH into the new server as ```root``` and create an account specifically for running the application. 
Add the new user to the sudoers group.
Create home directory and change ownership to new user
Logout of ```root``` and ssh back in as the new user.
```
  adduser aerosource
  adduser aerosource aerosource
  adduser aerosource sudo
```

#### Preliminary Installation
Install MySQL Server, and set the root password when prompted.
```
  sudo apt-get update
  sudo apt-get install mysql-server
```
Activate MySQL and finish up with secure install. Remove anonymous users, disallow remote root login, remove test database, and reload privileges table.
```
  sudo mysql_install_db
  sudo /usr/bin/mysql_secure_installation
```
Login as root and create a blank aerosource database. Follow up by creating a user will all permissions (running locally) on this database, and read-only when remotely accessing.
```
  CREATE DATABASE aerosource CHARCTER SET utf8 COLLATE utf8_unicode_ci;
  CREATE USER 'aerosource'@'localhost' IDENTIFIED BY 'A3r0$0urce';
  CREATE USER 'aerosource'@'%' IDENTIFIED BY 'A3r0$0urce';
  GRANT ALL PRIVILEGES ON aerosource.* TO 'aerosource'@'localhost';
  GRANT SELECT ON aerosource.* TO 'aerosource'@'%';
  FLUSH PRIVILEGES;
```
If remote access to the MySQL database is needed, the bind address config parameter needs to be changed followed by a restart of the database server.
```
  sudo vi /etc/mysql/my.cnf
  Comment the line starting with "bind-address" and save.
  sudo service mysql restart
```
Install Java 7 JDK
```
  sudo apt-get install openjdk-7-jre
```
Make note of which JDK was installed, as the web application needs to be built with an equivalent or older version of this JDK.
```
  java -version
  Look for the "java version" line (1.7.0_XX)
```
Install Supervisor to manage the Web Application. This will ensure that the app restarts should the server reboot, or the app goes down.
```
  sudo apt-get install supervisor
```
Finally, additional entropy needs to be added to the server to allow the web application's methods relying on randomness to function correctly.
```
	sudo apt-get install haveged
```

#### Application Preparation And Build
In order for the application to function with new server configuration, the database parameters need to be altered.
Open the file called "AppConfiguration.java" in the root of the Java src directory and modify the connection parameters:
```
@Bean
public DataSource dataSource() {
	BasicDataSource dataSource = new BasicDataSource();
	dataSource.setTestOnBorrow(true);
	dataSource.setValidationQuery("SELECT 1");
	dataSource.setUrl("jdbc:mysql://localhost:3306/aerosource");
	dataSource.setUsername("aerosource");
	dataSource.setPassword("A3r0$0urce");
	return dataSource;
}
```
On your local machine (Linux), install a Java 7 JDK with the same or older version as found on the server (see Java install instructions above). Also install Gradle to auto build the application using the source. 
Navigate to the root of the project directory and build the application via Gradle:
```
  gradle build
```
The runnable jar will be found in <PROJECT_ROOT>/build/libs.

#### Finalizing The Installation And Deploying The Application
SSH back in the VPS as the ```aerosource```, and create a web directory with ownership as this user.
```
	sudo mkdir /www
	sudo chown aerosource:aerosource -R /www
	sudo chmod -R 770 /www
```
Create a subdirectory to hold the uploaded user files (part of the surveys).
```
	mkdir /www/user_uploads && chmod -R 770 /www/user_uploads
```
Create another subdirectory to hold the web app.
```
	mkdir /www/aerosouce && chmod -R 770 /www/aerosource
```
Finally create a log directory.
```
	mkdir /www/aerosource/logs && chmod -R 770 /www/aerosource/logs
```
SCP the compiled jar on your local machine to the VPS.
```
	scp <PATH_TO_COMPILED_JAR>/Aerosource-1_0_0.jar aerosource@XXX.XXX.XXX.XXX:/www/aerosource
```
Back on the VPS, change the permissions on the Jar to allow execution.
```
	chmod 770 /www/aerosource/Aerosource-1.0.0.jar
```
Create a Supervisor configuration file for the aerosource application.
```
	sudo vi /etc/supervisor/conf.d/aerosource.conf
```
Add the following configuration:
```
	[program:aerosource]
	command=/usr/bin/java -jar /www/aerosource/Aerosource-1.0.0.jar
	user=aerosource
	autostart=true
	autorestart=true
	startsecs=10
	startretries=3
	stdout_logfile=/www/aerosource/logs/aerosource-stdout.log
	stderr_logfile=/www/aerosource/logs/aerosource-stderr.log
```
SCP the MySQL database dump to the VPS, and import it into aerosource
```
	mysql -u root -p aerosource < <PATH_TO_DB_DUMP>/aerosource_dump.sql
```
SCP the packages "user_uploads" file and extract in the user_uploads directory.
```
	tar -xzvf user_uploads.tar.gz
```
Reboot the server and verify that the application is running by opening a browser and going to the IP address port 8080.

#### Securing the Server
Add the following firewall rules to only allow SSH, HTTP, MySQL, and forwarding HTTP -> 8080:
```
  sudo iptables -I INPUT 1 -i lo -j ACCEPT                (allow inter-process communication)
  sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
  sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 3306 -j ACCEPT
```
Install iptable-persistent package to save these rules permanently.
```
  sudo apt-get update
  sudo apt-get install iptables-persistent
```
Add the last rule to drop all other packets, and save the changes.
```
  sudo iptables -P INPUT DROP
  sudo service iptables-persistent save
```


# Peer Lending Library
Peer Lending Library Web Portal is an online platform that allows users to lend and borrow books directly from one another, promoting knowledge sharing, community interaction, and better use of personal book collections through a secure and easy-to-use system.

## 💻 Stack Used
Frontend: HTML, CSS, JavaScript 

Frontend: React

Backend: Sprintboot

Database: MySQL

Version Control: Git & GitHub

Setup & Run Instructions

Setup the Backend (Spring Boot + MySQL)
Step 1: Create the Spring Boot project

Use Spring Initializr:

Go to https://start.spring.io/

Choose:

Project: Maven

Language: Java

Spring Boot: 3.x

Dependencies:
✅ Spring Web
✅ Spring Data JPA
✅ MySQL Driver
✅ Spring Boot DevTools (optional)

Download and unzip the project, then place it inside backend/.

Step 2: Configure MySQL

Create a new database:

CREATE DATABASE sims_db;

Step 3: Configure application.properties

Inside backend/src/main/resources/application.properties:

spring.datasource.url=jdbc:mysql://localhost:3306/sims_db
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
server.port=8080

Step 4: Run the Spring Boot server

In VS Code terminal:

cd backend
mvn spring-boot:run


✅ The backend will run at:
http://localhost:8080

💻 4. Setup the Frontend (React)
Step 1: Create React app

In VS Code terminal:

cd project-root
npx create-react-app frontend
cd frontend
npm start


✅ Runs on: http://localhost:3000

Step 2: Connect React to Spring Boot

Example API call (inside React):

fetch("http://localhost:8080/api/students")
  .then(response => response.json())
  .then(data => console.log(data));


To avoid CORS issues, add this to your Spring Boot backend:

@CrossOrigin(origins = "http://localhost:3000")


above your controller class.

🗃️ 5. Git & GitHub Setup
Step 1: Initialize Git
cd project-root
git init
git add .
git commit -m "Initial commit"

Step 2: Create GitHub Repo

Go to https://github.com/new

Create a repo (e.g., sims-project)

Copy your repo URL

Step 3: Push to GitHub
git remote add origin https://github.com/YourUsername/sims-project.git
git branch -M main
git push -u origin main

🚀 6. Run Everything Together

Start MySQL Server

Run Backend:

cd backend
mvn spring-boot:run


→ http://localhost:8080

Run Frontend:

cd frontend
npm start


→ http://localhost:3000

Open Browser

React (UI): http://localhost:3000

Spring Boot API: http://localhost:8080

🧠 7. Optional: VS Code Extensions

Install these helpful extensions:

Java Extension Pack

Spring Boot Extension Pack

MySQL

Prettier – Code Formatter

ES7+ React/Redux snippets

GitLens

## 👥 Team Members
    Bebiro, Ryan –  ryan.bebiro@cit.edu
	Dinapo, Nash -	alexandreinash.dinapo@cit.edu
	Azcona, Jeffer – jeffer.azcona@cit.edu
	Sagaral, Earl Jericho - earljericho.sagaral@cit.edu

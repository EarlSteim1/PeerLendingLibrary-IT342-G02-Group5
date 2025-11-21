# Backend (Spring Boot)

This folder contains a minimal Spring Boot 3.x application that exposes a small Books API for the frontend.

Quick start

- Edit `src/main/resources/application.properties` and set your MySQL `url`, `username`, and `password`.
- From repository root run (PowerShell):

```powershell
cd backend
mvn spring-boot:run
```

The app will start on `http://localhost:8080` and the books endpoints are under `http://localhost:8080/api/books`.

Frontend integration

- Option 1: In the frontend, call the API directly at `http://localhost:8080/api/...`.
- Option 2: Add a proxy to the React `frontend/package.json` (development only):

```json
"proxy": "http://localhost:8080"
```

Notes

- `spring.jpa.hibernate.ddl-auto=update` is convenient for development but consider migrations for production.
- Update DB credentials in `application.properties` before running.

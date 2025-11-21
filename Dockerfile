## Multi-stage Dockerfile: build with Maven, run the Spring Boot jar
FROM maven:3.9.3-eclipse-temurin-17 as build
WORKDIR /workspace
COPY pom.xml mvnw* .mvn/ ./
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

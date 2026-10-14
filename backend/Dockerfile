# Build stage: use Maven with Eclipse Temurin JDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source files and package application (tests skipped in container build)
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage: minimal Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Copy built executable JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Render assigns port dynamically via PORT environment variable, defaults to 8080
EXPOSE 8080

# Launch application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
.\mvnw.cmd clean package -DskipTests

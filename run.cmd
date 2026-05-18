@echo off
REM Windows entry point for the backend.
REM Usage:
REM   run.cmd          -> start backend on :8080 (dev profile, H2)
REM   run.cmd build    -> compile only
REM   run.cmd package  -> build executable JAR
REM   run.cmd clean    -> remove build output

setlocal

REM --- locate JDK 21 -----------------------------------------------------
if defined JAVA_HOME goto :have_java
if exist "%ProgramFiles%\Amazon Corretto\jdk21" set "JAVA_HOME=%ProgramFiles%\Amazon Corretto\jdk21"
if exist "%ProgramFiles%\Eclipse Adoptium\jdk-21" set "JAVA_HOME=%ProgramFiles%\Eclipse Adoptium\jdk-21"
if exist "%ProgramFiles%\Microsoft\jdk-21" set "JAVA_HOME=%ProgramFiles%\Microsoft\jdk-21"
if exist "%ProgramFiles%\Java\jdk-21" set "JAVA_HOME=%ProgramFiles%\Java\jdk-21"

:have_java
if not defined JAVA_HOME (
  echo ERROR: JAVA_HOME is not set and no JDK 21 found in standard locations.
  echo Install a JDK 21 ^(e.g. Amazon Corretto 21^) and set JAVA_HOME.
  exit /b 1
)
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM --- dispatch ---------------------------------------------------------
if "%1"=="build"   ( call mvnw.cmd -q compile & exit /b )
if "%1"=="package" ( call mvnw.cmd -q -DskipTests package & exit /b )
if "%1"=="test"    ( call mvnw.cmd test & exit /b )
if "%1"=="clean"   ( call mvnw.cmd -q clean & exit /b )

REM default: run dev backend
call mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev

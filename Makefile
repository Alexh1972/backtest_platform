UNAME_S := $(shell uname -s 2>/dev/null)

ifeq ($(UNAME_S),Darwin)
  JAVA_HOME := $(shell /usr/libexec/java_home -v 21 2>/dev/null)
endif
ifeq ($(UNAME_S),Linux)
  JAVA_HOME ?= $(shell update-java-alternatives -l 2>/dev/null | awk '/21/ {print $$3; exit}')
endif

ifneq ($(JAVA_HOME),)
  export JAVA_HOME
  export PATH := $(JAVA_HOME)/bin:$(PATH)
endif

MVNW := ./mvnw

.PHONY: help build run clean test package

help:
	@echo "Targets:"
	@echo "  make build    - compile Java sources"
	@echo "  make run      - start the Spring Boot backend on :8080 (dev profile, H2)"
	@echo "  make package  - build an executable JAR in ./target"
	@echo "  make test     - run tests"
	@echo "  make clean    - remove build output"
	@echo ""
	@echo "JAVA_HOME = $(JAVA_HOME)"

build:
	$(MVNW) -q compile

run:
	$(MVNW) spring-boot:run -Dspring-boot.run.profiles=dev

package:
	$(MVNW) -q -DskipTests package

test:
	$(MVNW) test

clean:
	$(MVNW) -q clean

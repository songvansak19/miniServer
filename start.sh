#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
mkdir -p bin
javac --release 17 -cp "lib/*" -d bin src/*.java
java -cp "bin:lib/*" Main

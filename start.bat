if not exist "bin" (
    mkdir bin
)
javac -cp "lib/*" -d bin src/*.java && java -cp "bin;lib/*" Main
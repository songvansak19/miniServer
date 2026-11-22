if not exist "bin" (
    mkdir bin
)
javac --release 17 -cp "lib/*" -d bin src/*.java && java -cp "bin;lib/*" Main
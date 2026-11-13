const submit = document.getElementById("submit");
let username = document.getElementById("username").value;

submit.onclick = function () {
	username = document.getElementById("username").value;
	const String = document.getElementById("header");
	if (username !== "") String.textContent = `Hi, ${username}`;
	else String.textContent = "Banking System👋";
};

function sum(...numbers) {
	let sum = 0;
	for (let number of numbers) {
		sum += number;
	}
	console.log(sum);
}

sum(1, 2, 4, 5, 6);

function combine(...elements) {
	return elements;
}

console.log(combine(1, 2, 3, 4, 5, 6));

function sentence(...words) {
	return words.join(" ");
}

console.log(sentence("Hello,", "World!"));

function func1(func1) {
	console.log("HEllO");
	func1();
}

function func2() {
	console.log("GOODBYE");
}

func1(func2);

const arr = [1, 2, 3, 4, 5];

const arr1 = arr.map(function (element, index) {
	if (index === 1) return (element = 10);
	else return element;
});

console.log(arr1);

const newArr = arr.filter((element) => element % 2 === 0);

console.log(newArr);

arr.forEach(function (element, index, array) {
	array[index] === 3 ? (array[index] = 10) : (array[index] = element);
});

console.log(arr);

arr.forEach(function (element, index, array) {
	console.log("Element: " + element, "Index: " + index, "Array: " + array);
});

const person = {
	name: "Song Vansak",
	age: 19,
	isEmployed: false,
	sayHello: function (str) {
		console.log(`Hello, I'm ${this.name}. ${str}`);
	},
	getSalary: function () {
		const salary = 1000;
		console.log(`My salary is ${salary}`);
	},
};

console.log(person);

console.log(person.name);
console.log(person.sayHello("This is my first object"));

class Car {
    constructor(name, brand, year, price) {
        this.name = name;
        this.brand = brand;
        this.year = year;
        this.price = price;

        this.display = function () {
            console.log("Hi");
        };
    }
}

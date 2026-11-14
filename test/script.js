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
	sayHello(str) {
		console.log(`Hello, I'm ${this.name}. ${str}`);
	},
	getSalary() {
		const salary = 1000;
		console.log(`My salary is ${salary}`);
	},
};

console.log(person);

console.log(person.name);
person.sayHello("This is my first object");
person.getSalary();

class Car {
	static str = "This is just a variable.";

	constructor(name, brand, year, price) {
		this.name = name;
		this.brand = brand;
		this.year = year;
		this.price = price;

		this.display = function () {
			console.log("Hi");
		};
	}

	static func() {
		console.log("This is just a static function.");
	}
}

console.log(Car.str);
Car.func();

class Toyota extends Car {
	static #num = 67; // Private variable

	static print() {
		console.log("This is Toyota car!!");
	}

	static getNum() {
		return this.#num;
	}
}

console.log(Toyota.getNum());
Toyota.print();

const arrayObject = [
	{ name: "Sak", age: 19 },
	{ brand: "Lambo", year: 2026 },
];

console.log(arrayObject[0].name);
console.log(arrayObject[1].year);

setTimeout(() => window.alert("Hello, World!"), 3000);

submit.onclick = async function () {
	setTimeout(() => {
		let variable = document.getElementById("Hello");
		variable.textContent = "Hello, World!";

		setTimeout(() => (variable.textContent = ""), 1000);
	}, 1000);
};

// ===== STOPWATCH ===== //
let timer = 0;
let milisecond = 0;
let intervalId;
const clock = document.getElementById("timer");
const startButton = document.getElementById("start");

startButton.onclick = async function () {
	this.disabled = true;
	intervalId = setInterval(() => {
		milisecond++;
		if (milisecond > 99) {
			milisecond = 0;
			timer++;
		}
		clock.textContent = `${timer.toString().padStart(2, 0)}:${milisecond.toString().padStart(2, 0)}`;
	}, 10);
};

document.getElementById("pause").onclick = async function () {
	startButton.disabled = false;
	clearInterval(intervalId);
};

document.getElementById("reset").onclick = async function () {
	startButton.disabled = false;
	clearInterval(intervalId);

	timer = 0;
	clock.textContent = "00:00";
};
// ====================== //

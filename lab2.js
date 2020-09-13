const fs = require('fs')
const puppeteer = require('puppeteer')
const assert = require('assert')
const path = require('path')
const spawn = require('child_process').spawn

const userFile = fs.readFileSync(path.resolve(process.env.USER_CODE_DIR, 'script.js'), 'utf8')

const results = []
// case 1
try {
	eval(`${userFile}\n;global.Book = Book`)
	assert(typeof Book === 'function')
	results.push(true)
} catch (error) {
	results.push(false)
}

// case 2
try {
	eval(`${userFile};global.Book = Book`)
	const book = new Book('hello', 'world', 12345)
	assert(book.title === 'hello')
	results.push(true)
} catch (error) {
	results.push(false)
}

// case 3
try {
	eval(`${userFile}\n;global.Book = Book`)
	const book = new Book('hello', 'world', 12345)
	assert(book.author === 'world')
	results.push(true)
} catch (error) {
	results.push(false)
}

// case 4
try {
	eval(`${userFile}\n;global.Book = Book`)
	const book = new Book('hello', 'world', 12345)
	assert(book.isbn === 12345)
	results.push(true)
} catch (error) {
	results.push(false)
}

// start testing user code

fs.writeFileSync(process.env.UNIT_TEST_OUTPUT_FILE, JSON.stringify(results))
process.exit(0)

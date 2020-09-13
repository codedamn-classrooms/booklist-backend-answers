const fs = require('fs')
const puppeteer = require('puppeteer')
const assert = require('assert')
const path = require('path')
const spawn = require('child_process').spawn

const retry = (fn, ms) =>
	new Promise((resolve) => {
		fn()
			.then(resolve)
			.catch(() => {
				setTimeout(() => {
					console.log('retrying...')
					retry(fn, ms).then(resolve)
				}, ms)
			})
	})

;(async () => {
	const results = []
	spawn('bash', ['-c', `cd ${process.env.USER_CODE_DIR} && static-server -p 1337`])
	const browser = await puppeteer.launch({
		executablePath: '/usr/bin/google-chrome',
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-accelerated-2d-canvas',
			'--no-first-run',
			'--no-zygote',
			'--single-process',
			'--disable-gpu'
		]
	})
	page = await browser.newPage()
	await retry(() => page.goto('http://localhost:' + process.env.PUBLIC_PORT), 1000)

	function delay(duration) {
		return new Promise((resolve) => {
			setTimeout(resolve, duration)
		})
	}

	// t1
	try {
		const test = await page.evaluate(() => {
			localStorage.removeItem('books')
			if (Store.getBooks().length !== 0) return false
			localStorage.setItem('books', JSON.stringify([{ title: 'x', author: 'y', isbn: 'z' }]))
			return Store.getBooks().length === 1
		})
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	// t2
	try {
		const test = await page.evaluate(() => {
			localStorage.removeItem('books')
			const book = new Book('x', 'y', 'z')
			Store.addBook(book)

			return Store.getBooks()[0].title === 'x'
		})
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	// t3
	try {
		const test = await page.evaluate(() => {
			localStorage.removeItem('books')
			const book = new Book('x', 'y', 'z')
			Store.addBook(book)
			if (Store.getBooks()[0].title !== 'x') return false

			Store.removeBook('z')

			return Store.getBooks().length === 0
		})
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	fs.writeFileSync(process.env.UNIT_TEST_OUTPUT_FILE, JSON.stringify(results))
	process.exit(0)
})()

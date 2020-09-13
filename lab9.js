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

	// t1
	try {
		const test = await page.evaluate(() => {
			return typeof Store === 'function'
		})
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	// t2
	try {
		const test = await page.evaluate(() => {
			return typeof Store.addBook === 'function'
		})
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	// t2
	try {
		const test = await page.evaluate(() => {
			return typeof Store.removeBook === 'function'
		})
		assert(test)
		results.push(true)
	} catch (error) {
		console.log(error)
		results.push(false)
	}

	// t2
	try {
		const test = await page.evaluate(() => {
			return typeof Store.getBooks === 'function'
		})
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	// start testing user code

	fs.writeFileSync(process.env.UNIT_TEST_OUTPUT_FILE, JSON.stringify(results))
	process.exit(0)
})()

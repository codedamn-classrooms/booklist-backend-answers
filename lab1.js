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
	let browser
	spawn('bash', ['-c', `cd ${process.env.USER_CODE_DIR} && static-server -p 1337`])
	try {
		browser = await puppeteer.launch({
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
		const response = await retry(
			() => page.goto('http://localhost:' + process.env.PUBLIC_PORT),
			1000
		)
		assert(response.status() === 200)
		const test2 = await page.evaluate((_) => {
			return !document.body.innerText.includes('MyBookList')
		})
		assert(test2)
		results.push(true)
	} catch (error) {
		console.log(error)
		results.push(false)
	}

	// start testing user code

	fs.writeFileSync(process.env.UNIT_TEST_OUTPUT_FILE, JSON.stringify(results))
	process.exit(0)
})()

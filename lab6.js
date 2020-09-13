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
		const test = await page.evaluate((_) => {
			return typeof UI.deleteBook === 'function'
		})
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	// t2
	try {
		const test = await page.evaluate((_) => {
			const author = document.getElementById('author')
			const title = document.getElementById('title')
			const isbn = document.getElementById('isbn')
			author.value = 'Mehul Mohan Book Author'
			title.value = 'Learning JavaScript'
			isbn.value = '69420'

			addABook({ preventDefault: () => 0 })

			const txt = document.body.innerText
			return txt.includes('69420')
		})
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	// t3
	try {
		const test = await page.evaluate((_) => {
			const author = document.getElementById('author')
			const title = document.getElementById('title')
			const isbn = document.getElementById('isbn')
			author.value = 'Mehul Mohan Book Author-test'
			title.value = 'Learning JavaScript'
			isbn.value = '694201114444'

			addABook({ preventDefault: () => 0 })

			const lastDelete = document.querySelectorAll('.delete')[
				document.querySelectorAll('.delete').length - 1
			]
			lastDelete.click()

			const txt = document.body.innerText

			return !txt.includes('694201114444') && !txt.includes('Mehul Mohan Book Author-test')
		})
		console.log(test)
		assert(test)
		results.push(true)
	} catch (error) {
		results.push(false)
	}

	// start testing user code

	fs.writeFileSync(process.env.UNIT_TEST_OUTPUT_FILE, JSON.stringify(results))
	process.exit(0)
})()

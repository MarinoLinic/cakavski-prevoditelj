import React, { useState } from 'react'
import csvData from './assets/cakavski-rjecnik.csv'

const App = () => {
	const [text, setText] = useState('')
	const [decodedText, setDecodedText] = useState('')

	const decodeText = () => {
		let decoded = text

		csvData.forEach((row: any) => {
			const regex = new RegExp(row.cakavski, 'g')
			decoded = decoded.replace(regex, row.stokavski)
		})

		setDecodedText(decoded)
	}

	const encodeText = () => {
		let encoded = text

		csvData.forEach((row: any) => {
			const regex = new RegExp(row.stokavski, 'g')
			encoded = encoded.replace(regex, row.cakavski)
		})

		setDecodedText(encoded)
	}

	return (
		<div>
			<textarea value={text} onChange={(e) => setText(e.target.value)} />
			<br />
			<button onClick={decodeText}>Decode</button>
			<button onClick={encodeText}>Encode</button>
			<br />
			<textarea value={decodedText} readOnly />
		</div>
	)
}

export default App

import { ChangeEvent, useState } from 'react'
import cakavskiRjecnik from './assets/cakavski-rjecnik.json'

interface Mapping {
	cakavski: string
	stokavski: string
}

function App() {
	const [stokavskiValue, setStokavskiValue] = useState<string>('')
	const [cakavskiValue, setCakavskiValue] = useState<string>('')

	const translateToCakavski = (input: string): string => {
		const wordList = input.split(' ')
		const translatedList = wordList.map((word) => {
			const mapping = cakavskiRjecnik.find((item: Mapping) => item.stokavski === word)
			if (mapping) {
				return mapping.cakavski
			}
			return word
		})
		return translatedList.join(' ')
	}

	const translateToStokavski = (input: string): string => {
		const wordList = input.split(' ')
		const translatedList = wordList.map((word) => {
			const mapping = cakavskiRjecnik.find((item: Mapping) => item.cakavski === word)
			if (mapping) {
				return mapping.stokavski
			}
			return word
		})
		return translatedList.join(' ')
	}

	const handleStokavskiChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
		const input = event.target.value
		setStokavskiValue(input)
		setCakavskiValue(translateToCakavski(input))
	}

	const handleCakavskiChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
		const input = event.target.value
		setCakavskiValue(input)
		setStokavskiValue(translateToStokavski(input))
	}

	return (
		<div>
			<label>
				Štokavski:
				<textarea rows={5} cols={50} value={stokavskiValue} onChange={handleStokavskiChange} />
			</label>
			<label>
				Čakavski:
				<textarea rows={5} cols={50} value={cakavskiValue} onChange={handleCakavskiChange} />
			</label>
		</div>
	)
}

export default App

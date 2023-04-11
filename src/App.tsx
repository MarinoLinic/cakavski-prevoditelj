import { ChangeEvent, useState } from 'react'
import cakavskiRjecnik from './assets/cakavski-rjecnik.json'
import Translator from './Translator'

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

	return (
		<div>
			<Translator
				translateFunction={translateToCakavski}
				inputState={[stokavskiValue, setStokavskiValue]}
				outputState={[cakavskiValue, setCakavskiValue]}
				label="Štokavski"
			/>
			<Translator
				translateFunction={translateToStokavski}
				inputState={[cakavskiValue, setCakavskiValue]}
				outputState={[stokavskiValue, setStokavskiValue]}
				label="Čakavski"
			/>
		</div>
	)
}

export default App

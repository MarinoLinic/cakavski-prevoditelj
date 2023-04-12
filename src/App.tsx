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
			const regex = /[?!.,-]/g
			let punct = ''
			let alt = false
			const vowels = 'aeiou'

			let cleanedWord = word.replace(regex, (match) => {
				punct += match
				return ''
			})

			const mapping = cakavskiRjecnik.find(
				(item: Mapping) => item.stokavski === cleanedWord || item.stokavski === cleanedWord + 'i' // govoriti, govorit
			)

			if (mapping) {
				return mapping.cakavski + punct
			}

			if (cleanedWord.endsWith('io')) {
				cleanedWord = cleanedWord.slice(0, -2) + 'il'
				alt = true
			}

			if (cleanedWord.endsWith('m')) {
				cleanedWord = cleanedWord.slice(0, -1) + 'n'
				alt = true
			}

			if (cleanedWord.includes('ije')) {
				if (cleanedWord.endsWith('ije')) {
					cleanedWord = cleanedWord.replace('ije', 'i')
				} else {
					cleanedWord = cleanedWord.replace('ije', 'e')
				}
				alt = true
			}

			for (let i = 0; i < vowels.length; i++) {
				let targetChar = vowels[i]

				if (cleanedWord.charAt(cleanedWord.length - 1) === targetChar) {
					const vowelMapping = cakavskiRjecnik.find(
						(item: Mapping) => item.stokavski.slice(0, -1) === cleanedWord.slice(0, -1)
					)

					if (vowelMapping) {
						if (vowels.includes(vowelMapping.cakavski.charAt(vowelMapping.cakavski.length - 1))) {
							return vowelMapping.cakavski.slice(0, -1) + targetChar + punct
						}
					}
				}
			}

			if (alt) return cleanedWord + punct

			return word
		})

		return translatedList.join(' ')
	}

	const translateToStokavski = (input: string): string => {
		const wordList = input.split(' ')
		const translatedList = wordList.map((word) => {
			const regex = /[?!.,-]/g
			let punct = ''

			const cleanedWord = word.replace(regex, (match) => {
				punct += match
				return ''
			})

			const mapping = cakavskiRjecnik.find((item: Mapping) => item.cakavski === cleanedWord)

			if (mapping) {
				return mapping.stokavski + punct
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

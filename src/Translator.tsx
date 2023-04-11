import { ChangeEvent } from 'react'

function Translator({
	translateFunction,
	inputState,
	outputState,
	label,
}: {
	translateFunction: (input: string) => string
	inputState: [string, React.Dispatch<React.SetStateAction<string>>]
	outputState: [string, React.Dispatch<React.SetStateAction<string>>]
	label: string
}) {
	const [input, setInput] = inputState
	const [output, setOutput] = outputState

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
		const input = event.target.value
		setInput(input)
		setOutput(translateFunction(input))
	}

	return (
		<label>
			{label}:
			<textarea rows={5} cols={50} value={input} onChange={handleChange} />
		</label>
	)
}

export default Translator

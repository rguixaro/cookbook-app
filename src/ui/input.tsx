import * as React from 'react'

import { cn } from '@/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>
export type TextareaProps =
	React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
		autoResize?: boolean
	}

export const InputGlobalStyles =
	'flex h-9 w-full rounded-2xl border border-forest-150 bg-transparent px-3 py-1 text-sm text-forest-200 shadow-center-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-forest-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-150 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-200'

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(InputGlobalStyles, className)}
				ref={ref}
				{...props}
			/>
		)
	},
)
Input.displayName = 'Input'

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ autoResize = false, className, onInput, ...props }, ref) => {
		const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

		const resize = React.useCallback(() => {
			const textarea = textareaRef.current
			if (!textarea) return

			textarea.style.height = 'auto'
			textarea.style.height = `${textarea.scrollHeight}px`
		}, [])

		React.useLayoutEffect(() => {
			if (autoResize) resize()
		}, [autoResize, props.defaultValue, props.value, resize])

		return (
			<textarea
				className={cn(
					InputGlobalStyles,
					'resize-none',
					'min-h-25',
					autoResize && 'overflow-hidden',
					className,
				)}
				ref={(element) => {
					textareaRef.current = element
					if (typeof ref === 'function') {
						ref(element)
					} else if (ref) {
						ref.current = element
					}
				}}
				onInput={(event) => {
					onInput?.(event)
					if (autoResize) resize()
				}}
				{...props}
			/>
		)
	},
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }

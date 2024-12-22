import * as React from 'react';

import { cn } from '@/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const InputGlobalStyles =
	'flex h-9 w-full rounded-lg border border-forest-200/15 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-200 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-200';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(InputGlobalStyles, className)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					InputGlobalStyles,
					'resize-none',
					'min-h-[100px]',
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };

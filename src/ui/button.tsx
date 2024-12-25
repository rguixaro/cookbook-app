import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils';

interface IconProps {
	Icon: LucideIcon;
	iconPlacement: 'left' | 'right';
}

interface IconRefProps {
	Icon?: never;
	iconPlacement?: undefined;
}

export type ButtonIconProps = IconProps | IconRefProps;

const buttonVariants = cva(
	'inline-flex items-center space-x-3 justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-neutral-500',
	{
		variants: {
			variant: {
				default:
					'bg-forest-200 text-neutral-50 shadow hover:bg-forest-200/90',
				destructive:
					'bg-red-500 text-neutral-50 shadow-sm hover:bg-red-500/90',
				outline:
					'bg-forest-200/15 border-2 border-forest-200/15 shadow-sm hover:bg-forest-200/60 text-neutral-600 shadow',
				ghost: 'hover:bg-forest-200/15 hover:text-neutral-900',
			},
			size: {
				default: 'h-9 px-4 py-2',
				sm: 'h-8 px-3 text-xs',
				lg: 'h-12 px-5',
				icon: 'h-9 w-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps & ButtonIconProps>(
	(
		{ className, variant, size, asChild = false, Icon, iconPlacement, ...props },
		ref
	) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}>
				{Icon && iconPlacement === 'left' && (
					<div className='group-hover:translate-x-100 w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-200 group-hover:w-4 group-hover:pr-1 group-hover:opacity-100'>
						<Icon size={18} />
					</div>
				)}
				<Slottable>{props.children}</Slottable>
				{Icon && iconPlacement === 'right' && (
					<div className='w-0 translate-x-[100%] pl-0 opacity-0 transition-all duration-200 group-hover:w-4 group-hover:translate-x-0 group-hover:pl-1 group-hover:opacity-100'>
						<Icon size={18} />
					</div>
				)}
			</Comp>
		);
	}
);
Button.displayName = 'Button';

export { Button, buttonVariants };

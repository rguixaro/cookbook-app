import { Loader } from 'lucide-react'

import { cn } from '@/utils'

export function ResultCountChip({
	label,
	loading = false,
	loadingLabel = 'Loading results',
	reserveLabel = label,
	className,
}: {
	label: string
	loading?: boolean
	loadingLabel?: string
	reserveLabel?: string
	className?: string
}) {
	return (
		<div className='flex w-full justify-center px-1'>
			<div
				className={cn(
					'inline-flex min-h-8 items-center rounded-xl bg-forest-100 px-3 py-1 text-forest-300',
					className,
				)}>
				{loading ? (
					<span className='relative inline-grid place-items-center text-xs font-bold'>
						<span
							aria-hidden='true'
							className='invisible whitespace-nowrap'>
							{reserveLabel}
						</span>
						<Loader
							role='status'
							aria-label={loadingLabel}
							size={13}
							strokeWidth={3}
							className='absolute animate-spin'
						/>
					</span>
				) : (
					<span className='text-xs font-bold'>{label}</span>
				)}
			</div>
		</div>
	)
}

'use client'

import { motion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
	return (
		<motion.div
			className='flex flex-col items-center w-full'
			initial={{ y: -6, marginTop: 5, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ ease: 'easeInOut', duration: 0.3 }}>
			{children}
		</motion.div>
	)
}

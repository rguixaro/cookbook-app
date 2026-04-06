'use client'

import { motion } from 'motion/react'

export const LoginIcon = () => {
	return (
		<motion.img
			src={'/images/logo.svg'}
			width={128}
			height={128}
			initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
			animate={{ scale: 1, opacity: 1, rotate: 0 }}
			transition={{
				duration: 0.5,
				delay: 0.1,
				type: 'spring',
				stiffness: 200,
				damping: 15,
			}}
			whileHover={{
				scale: 1.2,
				rotate: -5,
				transition: { duration: 0.2 },
			}}
			whileTap={{ scale: 0.95 }}
			className='cursor-pointer'
		/>
	)
}

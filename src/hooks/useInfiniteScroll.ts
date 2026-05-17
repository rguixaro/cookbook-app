'use client'

import { useCallback, useEffect, useRef } from 'react'

export function useInfiniteScroll(callback: () => void, enabled: boolean) {
	const callbackRef = useRef(callback)
	const nodeRef = useRef<HTMLDivElement | null>(null)
	const observedNodeRef = useRef<HTMLDivElement | null>(null)
	const observerRef = useRef<IntersectionObserver | null>(null)
	callbackRef.current = callback

	const disconnect = useCallback(() => {
		observerRef.current?.disconnect()
		observerRef.current = null
		observedNodeRef.current = null
	}, [])

	const observeNode = useCallback(
		(node: HTMLDivElement | null) => {
			if (!enabled || !node) return
			if (observerRef.current && observedNodeRef.current === node) return

			const observer = new IntersectionObserver(
				([entry]) => {
					if (entry?.isIntersecting) {
						callbackRef.current()
					}
				},
				{ rootMargin: '200px' },
			)

			disconnect()
			observer.observe(node)
			observerRef.current = observer
			observedNodeRef.current = node
		},
		[disconnect, enabled],
	)

	const sentinelRef = useCallback(
		(node: HTMLDivElement | null) => {
			nodeRef.current = node
			if (!node) {
				disconnect()
				return
			}
			observeNode(node)
		},
		[disconnect, observeNode],
	)

	useEffect(() => {
		if (!enabled) {
			disconnect()
			return
		}

		observeNode(nodeRef.current)
		return disconnect
	}, [disconnect, enabled, observeNode])

	return sentinelRef
}

/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

const LINK_DISTANCE = 130
const POINTER_DISTANCE = 180

interface ParticleFieldProps {
  className?: string
}

/**
 * Decorative canvas network: drifting nodes linked by faint lines, which also
 * reach toward the pointer. Pauses off-screen and on hidden tabs; draws a
 * single static frame when reduced motion is requested.
 */
export function ParticleField(props: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const pointer = { x: -9999, y: -9999 }
    let particles: { x: number; y: number; vx: number; vy: number }[] = []
    let width = 0
    let height = 0
    let frameId = 0
    let inView = true

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(90, Math.round((width * height) / 15000))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > width) p.vx *= -1
          if (p.y < 0 || p.y > height) p.vy *= -1
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const distance = Math.hypot(a.x - b.x, a.y - b.y)
          if (distance > LINK_DISTANCE) continue
          ctx.strokeStyle = `rgba(96, 165, 250, ${(1 - distance / LINK_DISTANCE) * 0.28})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        const toPointer = Math.hypot(a.x - pointer.x, a.y - pointer.y)
        if (toPointer < POINTER_DISTANCE) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - toPointer / POINTER_DISTANCE) * 0.6})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(pointer.x, pointer.y)
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(56, 189, 248, 0.75)'
        ctx.beginPath()
        ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = () => {
      draw()
      frameId = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(frameId)
      if (reduceMotion) {
        draw()
        return
      }
      if (inView && document.visibilityState === 'visible') {
        frameId = requestAnimationFrame(loop)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      if (reduceMotion) draw()
    }

    const onResize = () => {
      resize()
      start()
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      start()
    })

    resize()
    start()
    observer.observe(canvas)
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', start)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', start)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none size-full', props.className)}
    />
  )
}

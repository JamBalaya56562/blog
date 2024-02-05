import { expect, test } from 'bun:test'
import { render } from '@testing-library/react'
import Home from './page'

render(<Home />)

test('p test', () => {
  const p = document.querySelectorAll('p')
  expect(p[0]?.innerText).toEqual('Get started by editing\u00A0app/page.tsx')
  expect(p[1]?.innerText).toEqual(
    'Find in-depth information about Next.js features and API.',
  )
  expect(p[2]?.innerText).toEqual(
    'Learn about Next.js in an interactive course with\u00A0quizzes!',
  )
  expect(p[3]?.innerText).toEqual('Explore the Next.js 13 playground.')
  expect(p[4]?.innerText).toEqual(
    'Instantly deploy your Next.js site to a shareable URL with Vercel.',
  )
})

test('Image test', () => {
  const img = document.querySelectorAll('img')
  expect(img[0]?.alt).toEqual('Vercel Logo')
  expect(img[1]?.alt).toEqual('Next.js Logo')
})

test('h2 test', () => {
  const h2 = document.querySelectorAll('h2')
  expect(h2[0]?.innerText).toEqual('Docs ->')
  expect(h2[1]?.innerText).toEqual('Learn ->')
  expect(h2[2]?.innerText).toEqual('Templates ->')
  expect(h2[3]?.innerText).toEqual('Deploy ->')
})

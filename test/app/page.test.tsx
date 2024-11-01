import { expect, test } from "bun:test"
import Home from "@/app/page.tsx"
import { render } from "@testing-library/react"

render(<Home />)

test("Image test", () => {
  const img = document.querySelectorAll("img")
  expect(img[0]?.alt).toEqual("Next.js logo")
  expect(img[1]?.alt).toEqual("Vercel logomark")
  expect(img[2]?.alt).toEqual("File icon")
  expect(img[3]?.alt).toEqual("Window icon")
  expect(img[4]?.alt).toEqual("Globe icon")
})

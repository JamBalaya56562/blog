import { expect, test } from "bun:test"
import { render } from "@testing-library/react"
import Home from "@/app/page.tsx"

render(<Home />)

test("Image test", () => {
  const img = document.querySelectorAll("img")

  expect(img[0]?.alt).toEqual("Next.js logo")
  expect(img[0]?.className).toContain("")
  expect(img[0]?.src).toContain("/next.svg")

  expect(img[1]?.alt).toEqual("Vercel logomark")
  expect(img[1]?.src).toContain("/vercel.svg")

  expect(img[2]?.alt).toEqual("File icon")
  expect(img[2]?.src).toContain("/file.svg")

  expect(img[3]?.alt).toEqual("Window icon")
  expect(img[3]?.src).toContain("/window.svg")

  expect(img[4]?.alt).toEqual("Globe icon")
  expect(img[4]?.src).toContain("/globe.svg")
})

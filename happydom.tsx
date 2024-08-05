import { mock } from "bun:test"
import { GlobalRegistrator } from "@happy-dom/global-registrator"
import type { ImageProps, StaticImageData } from "next/image"
import type { ComponentType, ReactElement } from "react"

GlobalRegistrator.register()

interface EsModuleDefault<T> {
  readonly __esModule: true
  readonly default: T
}

type StaticRequire = ImageProps["src"] extends
  | infer T
  | StaticImageData
  | string
  ? T
  : never

const mapStaticImportToSrc = (
  staticImport: StaticImageData | StaticRequire,
): string => {
  if ("default" in staticImport) {
    return staticImport.default.src
  }
  return staticImport.src
}

const mapNextImageSrcToString = (
  src: StaticImageData | StaticRequire | string,
): string => {
  if (typeof src === "string") {
    return src
  }
  return mapStaticImportToSrc(src)
}

function MockNextImage({
  alt,
  height,
  src: nextImageSrc,
  width,
}: Readonly<ImageProps>): ReactElement {
  const imgSrc: string = mapNextImageSrcToString(nextImageSrc)
  return <img alt={alt} height={height} src={imgSrc} width={width} />
}

mock.module("next/image", (): EsModuleDefault<ComponentType<ImageProps>> => {
  return {
    __esModule: true,
    default: MockNextImage,
  }
})

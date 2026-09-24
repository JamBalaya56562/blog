import type { Root } from "mdast"
import type { Node } from "unist"
import { visit } from "unist-util-visit"

/**
 * An ESTree node, as far as this file looks at one. The MDX parser attaches
 * the tree of each `{…}` it finds as `data.estree`.
 */
interface EstreeNode {
  readonly type: string
  readonly [key: string]: unknown
}

interface ExpressionNode extends Node {
  readonly data?: { readonly estree?: EstreeNode | null }
}

interface JsxAttribute {
  readonly type: string
  readonly name?: string
  readonly value?: string | ExpressionNode | null
}

interface JsxElementNode extends Node {
  readonly name: string | null
  readonly attributes: readonly JsxAttribute[]
}

/**
 * Whether an expression is a plain value: a string, number, boolean or null,
 * or an array or object built only from those. That is everything the posts
 * pass their components, like `steps={[…]}` or `labels={{ … }}`, and it is
 * data rather than code. An identifier, a call, a member access or a template
 * with a hole can each reach `process` or `globalThis` once evaluated.
 */
function isStaticValue(node: EstreeNode): boolean {
  switch (node.type) {
    case "Literal":
      return true
    case "TemplateLiteral":
      return (node.expressions as unknown[]).length === 0
    case "UnaryExpression":
      return (
        (node.operator === "-" || node.operator === "+") &&
        (node.argument as EstreeNode).type === "Literal" &&
        typeof (node.argument as EstreeNode).value === "number"
      )
    case "ArrayExpression":
      return (node.elements as (EstreeNode | null)[]).every(
        (element) => element !== null && isStaticValue(element),
      )
    case "ObjectExpression":
      return (node.properties as EstreeNode[]).every(
        (property) =>
          property.type === "Property" &&
          property.kind === "init" &&
          !property.computed &&
          !property.method &&
          !property.shorthand &&
          ((property.key as EstreeNode).type === "Identifier" ||
            (property.key as EstreeNode).type === "Literal") &&
          isStaticValue(property.value as EstreeNode),
      )
    default:
      return false
  }
}

/**
 * Whether a `{…}` holds nothing but a plain value. A program with no
 * statements is a comment written in braces, and runs nothing.
 */
function isStaticProgram(program: EstreeNode | null | undefined): boolean {
  if (!program) {
    return false
  }
  const body = program.body as EstreeNode[]
  if (body.length === 0) {
    return true
  }
  return (
    body.length === 1 &&
    body[0]?.type === "ExpressionStatement" &&
    isStaticValue(body[0].expression as EstreeNode)
  )
}

function refuse(node: Node, what: string): never {
  const at = node.position
    ? ` at ${node.position.start.line}:${node.position.start.column}`
    : ""
  throw new Error(`MDX ${what}${at} is not allowed in a post`)
}

/**
 * Stops a post running code on the server.
 *
 * MDX compiles a post to a JavaScript module and evaluates it where it is
 * rendered, so an `import`, an `export` or any `{expression}` in the source
 * runs with the server's full privileges. The posts are written in this
 * repository today, but `CONTENT_SOURCE=github` fetches them at request
 * time, and whoever can change that content would otherwise be able to run
 * anything on the function, its role's credentials included.
 *
 * This refuses the post rather than stripping the code out: a post that
 * silently lost part of itself is the harder failure to notice. What it
 * lets through is components and their plain-value props, which is all the
 * posts use.
 */
export function remarkStaticMdx() {
  return (tree: Root) => {
    visit(tree as Node, (node: Node) => {
      switch (node.type) {
        case "mdxjsEsm":
          refuse(node, "import/export")
          break
        case "mdxFlowExpression":
        case "mdxTextExpression":
          if (!isStaticProgram((node as ExpressionNode).data?.estree)) {
            refuse(node, "expression")
          }
          break
        case "mdxJsxFlowElement":
        case "mdxJsxTextElement":
          for (const attribute of (node as JsxElementNode).attributes) {
            if (attribute.type === "mdxJsxExpressionAttribute") {
              refuse(node, "spread attribute")
            }
            const value = attribute.value
            if (
              typeof value === "object" &&
              value !== null &&
              !isStaticProgram(value.data?.estree)
            ) {
              refuse(node, `expression in attribute "${attribute.name}"`)
            }
          }
          break
        default:
          break
      }
    })
  }
}

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FigureNodeView } from "./FigureNodeView";

export type FigureAlign = "left" | "center" | "right";
export type FigureSize = "small" | "medium" | "large" | "xlarge" | "original";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      insertFigure: (attrs: {
        src: string;
        alt?: string;
        align?: FigureAlign;
        size?: FigureSize;
      }) => ReturnType;
    };
  }
}

export const Figure = Node.create({
  name: "figure",
  group: "block",
  // figcaption 內容可以是 inline 文字
  content: "inline*",
  draggable: true,
  isolating: true,
  defining: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) =>
          (el as HTMLElement).querySelector("img")?.getAttribute("src") ?? null,
        renderHTML: () => ({}),
      },
      alt: {
        default: "",
        parseHTML: (el) =>
          (el as HTMLElement).querySelector("img")?.getAttribute("alt") ?? "",
        renderHTML: () => ({}),
      },
      align: {
        default: "center" as FigureAlign,
        parseHTML: (el) =>
          (el as HTMLElement).getAttribute("data-align") ?? "center",
        renderHTML: (attrs) => ({ "data-align": attrs.align }),
      },
      size: {
        default: "medium" as FigureSize,
        parseHTML: (el) =>
          (el as HTMLElement).getAttribute("data-size") ?? "medium",
        renderHTML: (attrs) => ({ "data-size": attrs.size }),
      },
      width: {
        default: null as string | null,
        parseHTML: (el) => (el as HTMLElement).style.width || null,
        renderHTML: (attrs) => {
          if (!attrs.width) return {};
          return { style: `width: ${attrs.width}; max-width: 100%;` };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="figure"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { "data-type": "figure" }),
      ["img", { src: node.attrs.src, alt: node.attrs.alt }],
      ["figcaption", 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureNodeView);
  },

  addCommands() {
    return {
      insertFigure:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: {
                src: attrs.src,
                alt: attrs.alt ?? "",
                align: attrs.align ?? "center",
                size: attrs.size ?? "medium",
              },
              content: [],
            })
            .run(),
    };
  },
});

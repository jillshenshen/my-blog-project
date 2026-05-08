import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const MAX_INDENT = 8;
const DEFAULT_TYPES = ["paragraph", "heading"];

export const Indent = Extension.create<{ types: string[] }>({
  name: "indent",

  addOptions() {
    return { types: DEFAULT_TYPES };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const raw = (element as HTMLElement).getAttribute("data-indent");
              if (!raw) return 0;
              const v = parseInt(raw, 10);
              return Number.isFinite(v)
                ? Math.max(0, Math.min(MAX_INDENT, v))
                : 0;
            },
            renderHTML: (attributes) => {
              const v = (attributes as { indent?: number }).indent ?? 0;
              if (!v) return {};
              return { "data-indent": String(v) };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const types = this.options.types;
    return {
      indent:
        () =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!types.includes(node.type.name)) return;
            const current = (node.attrs.indent as number | undefined) ?? 0;
            const next = Math.min(MAX_INDENT, current + 1);
            if (next === current) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            changed = true;
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
      outdent:
        () =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!types.includes(node.type.name)) return;
            const current = (node.attrs.indent as number | undefined) ?? 0;
            const next = Math.max(0, current - 1);
            if (next === current) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            changed = true;
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },
});

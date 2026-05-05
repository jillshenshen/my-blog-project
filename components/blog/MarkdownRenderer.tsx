import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const prettyCodeOptions: PrettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  defaultLang: "plaintext",
};

async function renderMarkdown(content: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify)
    .process(content);
  return String(file);
}

type Props = {
  content: string;
};

export async function MarkdownRenderer({ content }: Props) {
  const html = await renderMarkdown(content);
  return (
    <div
      className="markdown mx-auto max-w-2xl text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

import { FC, memo } from "react";
import ReactMarkdown, { Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export const MemoizedReactMarkdown: FC<Options> = memo(
  (props) => (
    <ReactMarkdown {...props} remarkPlugins={[remarkGfm, remarkMath]} />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

MemoizedReactMarkdown.displayName = "MemoizedReactMarkdown";

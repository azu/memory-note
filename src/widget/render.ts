import React from "react";
import ReactDOMServer from "react-dom/server";
import { Widget, WidgetProps } from "./widget";

export const render = async (props: WidgetProps): Promise<string> => {
    const content = ReactDOMServer.renderToString(React.createElement(Widget, props));
    return toHTML({ content, contentTitle: "Memory Note" });
};

const toHTML = ({ content, contentTitle }: { content: string; contentTitle: string }): string => {
    return `<!DOCTYPE html>
  <html lang='ja'>
    <head>
      <meta charset='utf-8' />
      <meta name='viewport' content='width=device-width' />
      <title>${contentTitle}</title>
      <style>
        html,body, #app { 
          width: 100%;
          height: 100%;
          padding: 0;
          margin: auto;
          max-width: 800px;
       }
      </style>
    </head>
    <body>${content}</body>
  </html>`;
};

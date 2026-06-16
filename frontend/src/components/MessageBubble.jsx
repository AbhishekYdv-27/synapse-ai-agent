import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>

      {/* Synapse avatar — left side */}
      {!isUser && <div className="msg-avatar">S</div>}

      <div className="msg-content">
        <div className={`msg-bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}>

          {isUser ? (
            /* Plain text for user messages */
            <p>{message.content}</p>
          ) : (
            /* Markdown + code highlighting for AI messages */
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        borderRadius: "10px",
                        fontSize: "13px",
                        margin: "8px 0",
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Timestamp */}
        <span className="msg-time">{formatTime(message.created_at)}</span>
      </div>

      {/* User avatar — right side */}
      {isUser && <div className="msg-avatar user-avatar">U</div>}
    </div>
  );
}
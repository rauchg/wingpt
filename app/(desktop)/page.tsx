"use client";

import { nanoid } from "nanoid";
import { StartBar } from "./start-bar";
import Draggable from "react-draggable";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import styled, { useTheme } from "styled-components";
import { useDetectClickOutside } from "react-detect-click-outside";
import { useChat } from "ai/react";
import { MODELS } from "./models";
import { MemoizedReactMarkdown } from "./markdown";

import {
  Anchor,
  Button,
  TextInput,
  Toolbar,
  Window,
  WindowContent,
  MenuList,
  MenuListItem,
  Separator,
  Frame,
  WindowHeader,
  Hourglass,
  ScrollView,
} from "react95";

const INITIAL_WINDOW_WIDTH = 500;
const START_BAR_HEIGHT = 50;

const Wrapper = styled.div`
  box-sizing: border-box;
  visibility: visible !important;
  background: ${({ theme }) => theme.desktopBackground};
  height: 100dvh;
  .close-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-left: -1px;
    margin-top: -1px;
    transform: rotateZ(45deg);
    position: relative;
    &:before,
    &:after {
      content: "";
      position: absolute;
      background: ${({ theme }) => theme.materialText};
    }
    &:before {
      height: 100%;
      width: 3px;
      left: 50%;
      transform: translateX(-50%);
    }
    &:after {
      height: 3px;
      width: 100%;
      left: 0px;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  .resize-handle-wrapper {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 35px;
    height: 25px;
    text-align: right;
    cursor: nwse-resize;
  }

  .resize-handle {
    display: inline-block;
    width: 25px;
    height: 25px;
    background-image: linear-gradient(
      135deg,
      #fefefe 16.67%,
      #c6c6c6 16.67%,
      #c6c6c6 33.33%,
      #848584 33.33%,
      #848584 50%,
      #fefefe 50%,
      #fefefe 66.67%,
      #c6c6c6 66.67%,
      #c6c6c6 83.33%,
      #848584 83.33%,
      #848584 100%
    );
    background-size: 8.49px 8.49px;
    -webkit-clip-path: polygon(100% 0px, 0px 100%, 100% 100%);
    clip-path: polygon(100% 0px, 0px 100%, 100% 100%);
  }
`;

export default function Home() {
  const [chats, setChats] = useState<
    {
      id: string;
      initialX: number;
      initialY: number;
      initialWidth: number;
      initialHeight: number;
    }[]
  >([]);
  const [areChatsSynced, setAreChatsSynced] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);

  useEffect(() => {
    const { initialWidth, initialHeight } = getInitialWindowSize();

    const id = nanoid();
    setChats([
      {
        id,
        initialWidth,
        initialHeight,
        initialX: (window.innerWidth - initialWidth) / 2,
        initialY: (window.innerHeight - initialHeight) / 2,
      },
    ]);
    setFocusedWindowId(id);
  }, []);

  function onChatClose(id: string) {
    setChats((prev) => {
      const chats = prev.filter((chat) => chat.id !== id);
      if (focusedWindowId === id) {
        setFocusedWindowId(chats.length ? chats[chats.length - 1].id : null);
      }
      return chats;
    });
  }

  function onChatOpen() {
    const { initialWidth, initialHeight } = getInitialWindowSize();

    const id = nanoid();
    setFocusedWindowId(id);
    setChats((prev) => [
      ...prev,
      {
        id,
        initialWidth,
        initialHeight,
        initialX: getRandomInt(0, window.innerWidth - initialWidth),
        initialY: getRandomInt(
          0,
          window.innerHeight - initialHeight - START_BAR_HEIGHT,
        ),
        focused: true,
      },
    ]);
  }

  function onCreditsOpen() {
    setCreditsOpen(true);
    setFocusedWindowId("credits");
  }

  const { emit, on } = useEvents();

  return (
    <Wrapper style={{ visibility: "hidden" }}>
      {chats.map((chat) => (
        <ChatWindow
          initialX={chat.initialX}
          initialY={chat.initialY}
          initialWidth={chat.initialWidth}
          initialHeight={chat.initialHeight}
          focused={chat.id === focusedWindowId}
          on={(type, listener) => {
            return on(type, (e) => {
              if (e.fromChatId !== chat.id) {
                listener(e);
              } else {
                console.log("skipping event", type);
              }
            });
          }}
          emit={(type, data) => {
            emit(type, {
              ...data,
              fromChatId: chat.id,
            });
          }}
          onFocus={() => {
            setFocusedWindowId(chat.id);
          }}
          canSync={chats.length > 1}
          onChatClose={() => onChatClose(chat.id)}
          onSetSynced={(isSynced) => {
            setAreChatsSynced(isSynced);
          }}
          isSynced={areChatsSynced}
          index={chats.findIndex((c) => c.id === chat.id)}
          key={chat.id}
        />
      ))}

      {creditsOpen && (
        <CreditsWindow
          width={350}
          height={525}
          x={(window.innerWidth - 350) / 2}
          y={(window.innerHeight - 525) / 2}
          onClose={() => setCreditsOpen(false)}
          onFocus={() => setFocusedWindowId("credits")}
          focused={focusedWindowId === "credits"}
        />
      )}

      <StartBar onChatOpen={onChatOpen} onCreditsOpen={onCreditsOpen} />
    </Wrapper>
  );
}

function ChatWindow({
  index,
  initialWidth,
  initialHeight,
  initialX,
  initialY,
  focused,
  canSync,
  isSynced,
  on,
  emit,
  onFocus,
  onChatClose,
  onSetSynced,
}: {
  index: number;
  initialWidth: number;
  initialHeight: number;
  initialX: number;
  initialY: number;
  focused: boolean;
  canSync: boolean;
  isSynced: boolean;
  on: (type: string, listener: (e: any) => void) => () => void;
  emit: (type: string, data?: any) => void;
  onFocus: () => void;
  onChatClose: () => void;
  onSetSynced: (isSynced: boolean) => void;
}) {
  const theme = useTheme();
  const {
    data,
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    error,
    isLoading,
    handleSubmit,
  } = useChat();
  const [isModelListOpen, setIsModelListOpen] = useState<boolean>(false);
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragTypeRef = useRef<"move" | "resize" | null>(null);
  const initialFocusRef = useRef<boolean>(false);

  // TODO: control the x / y rather than
  // imperatively letting Draggable control it
  const [x, setX] = useState<number>(initialX);
  const [y, setY] = useState<number>(initialY);
  const [width, setWidth] = useState<number>(initialWidth);
  const [height, setHeight] = useState<number>(initialHeight);

  function focusInput() {
    // avoid doing this on "mobile"
    if (window.innerWidth > 600) {
      inputRef.current?.focus();
    }
  }

  useEffect(() => {
    if (!initialFocusRef.current && focused) {
      initialFocusRef.current = true;
      focusInput();
    }
  }, []);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      const child = scrollRef.current.children[0];
      child.scrollTop = child.scrollHeight;
    }
  }, [messages]);

  const handleSubmitWrapped = useCallback(
    (e: any) => {
      handleSubmit(e, {
        options: {
          body: {
            text: input,
            modelId,
          },
        },
      });
    },
    [modelId, handleSubmit],
  );

  const handleReset = useCallback(() => {
    stop();
    setMessages([]);
    setInput("");
  }, [setMessages, setInput, stop]);

  // implement syncing in a hacky way
  useEffect(() => {
    const offInput = on("input", (data) => {
      setInput(data.text);
    });

    const offSubmit = on("submit", () => {
      handleSubmitWrapped({
        preventDefault: () => { },
      });
    });

    const offReset = on("reset", handleReset);

    return () => {
      offInput();
      offSubmit();
      offReset();
    };
  }, [setInput, handleSubmitWrapped, handleReset]);

  return (
    <div onMouseDown={onFocus}>
      <Draggable
        axis="none"
        onStart={(e) => {
          if (e.target) {
            // @ts-ignore
            dragTypeRef.current = e?.target.matches(".window-header-handle")
              ? "move"
              : "resize";
          }
        }}
        onDrag={(_e, data) => {
          if (dragTypeRef.current === "move") {
            setX(x + data.deltaX);
            setY(y + data.deltaY);
          } else if (dragTypeRef.current === "resize") {
            setWidth(Math.max(300, data.deltaX + width));
            setHeight(Math.max(300, data.deltaY + height));
          }
        }}
        handle=".resize-handle-wrapper, .window-header-handle"
      >
        <Window
          style={{
            width: `${width}px`,
            minHeight: `${height}px`,
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            zIndex: focused ? 1 : 0,
          }}
        >
          <WindowHeader
            active={focused}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              className="window-header-handle"
              style={{
                flexGrow: 1,
              }}
            >
              <span
                style={{
                  pointerEvents: "none",
                }}
              >
                WinGPT {index > 0 ? `(${index})` : ""}
              </span>
            </div>
            <Button onClick={onChatClose}>
              <span className="close-icon" />
            </Button>
          </WindowHeader>
          <Toolbar>
            <Button
              variant="menu"
              size="sm"
              disabled={messages.length === 0 && input === ""}
              onClick={() => {
                stop();
                setMessages([]);
                setInput("");

                if (isSynced) {
                  emit("reset");
                }

                focusInput();
              }}
            >
              New Chat
            </Button>

            <div style={{ position: "relative" }}>
              <Button
                variant="menu"
                size="sm"
                style={{ display: "flex", gap: "0.2rem" }}
                onClick={() => setIsModelListOpen(true)}
              >
                Model
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  viewBox="0 0 320 448"
                >
                  <path
                    d="m16 764 144 144 144-144z"
                    style={{
                      fillRule: "evenodd",
                      stroke: "none",
                      strokeWidth: 1,
                      strokeLinecap: "butt",
                      strokeLinejoin: "miter",
                      strokeOpacity: 1,
                    }}
                    transform="translate(0 -604)"
                  />
                </svg>
              </Button>

              {isModelListOpen && (
                <ModelList
                  onModelSelect={(model) => {
                    setModelId(model);
                    focusInput();
                  }}
                  onClose={() => setIsModelListOpen(false)}
                  currentModel={modelId}
                />
              )}
            </div>
          </Toolbar>
          <WindowContent
            style={{
              display: "flex",
              flexGrow: 1,
              flexDirection: "column",
              height: 0,
            }}
          >
            <ScrollView
              ref={scrollRef}
              style={{
                padding: "0.5rem",
                // @ts-ignore
                background: theme.canvas,
                overflow: "auto",
                flexGrow: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <div
                      style={{
                        textAlign: m.role === "user" ? "right" : "left",
                        fontWeight: "bold",
                      }}
                    >
                      {m.role === "user" ? "User: " : "AI: "}
                    </div>
                    <div
                      style={{
                        textAlign: m.role === "user" ? "right" : "left",
                      }}
                    >
                      <MemoizedReactMarkdown>
                        {m.content as string}
                      </MemoizedReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollView>
          </WindowContent>
          <form
            onSubmit={(e) => {
              handleSubmitWrapped(e);

              if (isSynced) {
                emit("submit");
              }
            }}
          >
            <div
              style={{
                display: "flex",
                marginLeft: 16,
                marginBottom: 10,
                marginRight: 16,
                gap: "0.3rem",
              }}
            >
              <TextInput
                ref={inputRef}
                value={input}
                placeholder="ask anything…"
                onChange={(e) => {
                  handleInputChange(e);
                  if (isSynced) {
                    emit("input", { text: e.target.value });
                  }
                }}
                fullWidth
              />

              {canSync && (
                <Button
                  active={isSynced}
                  onClick={() => {
                    const newIsSynced = !isSynced;
                    onSetSynced(newIsSynced);
                    if (newIsSynced) emit("input", { text: input });
                    focusInput();
                  }}
                >
                  Sync
                </Button>
              )}

              <Button type="submit" primary style={{ width: 80 }}>
                {isLoading ? <Hourglass /> : <>Send</>}
              </Button>
            </div>
          </form>

          {/* @ts-ignore */}
          <Footer error={error} data={data} />

          <div className="resize-handle-wrapper">
            <div className="resize-handle"></div>
          </div>
        </Window>
      </Draggable>
    </div>
  );
}

function Footer({
  error,
  data,
}: {
  error?: Error;
  data?: Array<{ start?: number; end?: number; modelId: string }>;
}) {
  const lastData = data ? data[data.length - 1] : null;
  const lastLastData = data ? data[data.length - 2] : null;

  return (
    <Frame
      variant="well"
      style={{
        display: "block",
        margin: "0.25rem",
        height: "31px",
        lineHeight: "31px",
        paddingLeft: "0.25rem",
      }}
    >
      {error ? (
        <span style={{ color: "red" }}>{error.message}</span>
      ) : (
        <>
          {lastData ? MODELS.find((m) => m.id === lastData.modelId)?.name : ""}
          {lastData && lastData.end && lastLastData && (
            <span> — {lastData.end - lastLastData.start!}ms</span>
          )}
        </>
      )}
    </Frame>
  );
}

function ModelList({
  onClose,
  onModelSelect,
  currentModel,
}: {
  onClose: () => void;
  onModelSelect: (model: string) => void;
  currentModel: string;
}) {
  const ref = useDetectClickOutside({
    onTriggered: () => onClose(),
  });

  return (
    <MenuList
      ref={ref}
      style={{
        position: "absolute",
        left: "0",
        top: "100%",
        zIndex: 1,
      }}
    >
      {MODELS.map((model) => (
        <MenuListItem
          size="sm"
          primary={currentModel === model.id}
          key={model.id}
          onClick={() => {
            onModelSelect(model.id);
            onClose();
          }}
        >
          {model.name}
        </MenuListItem>
      ))}
    </MenuList>
  );
}

function getInitialWindowSize() {
  const initialWidth = Math.min(window.innerWidth - 50, INITIAL_WINDOW_WIDTH);

  const initialHeight = Math.min(
    window.innerHeight - 50,
    INITIAL_WINDOW_WIDTH * 0.8,
  );

  return { initialWidth, initialHeight };
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function useEvents() {
  const listeners = useRef<Record<string, ((detail: any) => void)[]>>({});

  const emit = useCallback((event: string, detail: any = {}) => {
    (listeners.current[event] || []).forEach((listener) => listener(detail));
  }, []);

  const on = useCallback((event: string, callback: (detail: any) => void) => {
    listeners.current[event] = (listeners.current[event] || []).concat(
      callback,
    );

    return () => {
      listeners.current[event] = (listeners.current[event] || []).filter(
        (listener) => listener !== callback,
      );
    };
  }, []);

  return {
    emit,
    on,
  };
}

function CreditsWindow({
  onFocus,
  onClose,
  width,
  height,
  x,
  y,
  focused = true,
}: {
  onFocus?: () => void;
  onClose?: () => void;
  width: number;
  height: number;
  x: number;
  y: number;
  focused?: boolean;
}) {
  return (
    <div onMouseDown={onFocus}>
      <Draggable handle=".window-header-handle">
        <Window
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            zIndex: focused ? 1 : 0,
          }}
        >
          <WindowHeader
            active={focused}
            className="window-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="window-header-handle" style={{ flexGrow: 1 }}>
              <span>Credits</span>
            </div>
            <Button onClick={onClose}>
              <span className="close-icon" />
            </Button>
          </WindowHeader>

          <WindowContent
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <img
                src="/icons/gpt.png"
                alt="Help"
                style={{ width: 64, height: 64 }}
              />

              <b style={{ fontWeight: "bold" }}>WinGPT</b>
            </div>
            <p>
              WinGPT is a demo of a Windows 95-like interface for conversational
              AI models.
            </p>

            <p>
              It was inspired by{" "}
              <Anchor
                href="https://twitter.com/lucas__crespo/status/1795870218234785865"
                target="_blank"
              >
                Lucas Crespo&rsquo;s tweet
              </Anchor>{" "}
              that asks: &ldquo;What if ChatGPT came out in &rsquo;95?&rdquo;
            </p>
            <Separator />
            <ul
              style={{
                textAlign: "left",
                width: "100%",
                fontSize: "0.8rem",
              }}
            >
              <li
                style={{
                  listStyleType: "square",
                  marginLeft: 16,
                }}
              >
                <Anchor
                  href="https://github.com/React95/React95"
                  target="_blank"
                >
                  React95
                </Anchor>
                : an UI library of Windows 95 components
              </li>
              <li
                style={{
                  listStyleType: "square",
                  marginLeft: 16,
                }}
              >
                <Anchor href="https://sdk.vercel.ai/docs" target="_blank">
                  Vercel AI SDK
                </Anchor>
                : easy TypeScript API to AI models
              </li>
              <li
                style={{
                  listStyleType: "square",
                  marginLeft: 16,
                }}
              >
                <Anchor href="https://nextjs.org" target="_blank">
                  Next.js
                </Anchor>
                : React framework (App Router &amp; Turbopack)
              </li>
              <li
                style={{
                  listStyleType: "square",
                  marginLeft: 16,
                }}
              >
                The supporting ecosystem and libraries:{" "}
                <Anchor href="https://github.com/nodejs/node" target="_blank">
                  Node.js
                </Anchor>
                ,{" "}
                <Anchor href="https://github.com/ai/nanoid" target="_blank">
                  nanoid
                </Anchor>
                ,{" "}
                <Anchor
                  href="https://github.com/mzabriskie/react-draggable"
                  target="_blank"
                >
                  react-draggable
                </Anchor>
                ,{" "}
                <Anchor
                  href="https://github.com/zhaluza/react-detect-click-outside"
                  target="_blank"
                >
                  react-detect-click-outside
                </Anchor>
                , and{" "}
                <Anchor
                  href="https://github.com/styled-components/styled-components"
                  target="_blank"
                >
                  styled-components
                </Anchor>{" "}
                (used by{" "}
                <Anchor
                  href="https://github.com/React95/React95"
                  target="_blank"
                >
                  React95
                </Anchor>
                ).
              </li>
            </ul>
            <Separator />
            <Button
              onClick={() => window.open("https://github.com/rauchg/wingpt")}
            >
              Source Code
            </Button>
          </WindowContent>
        </Window>
      </Draggable>
    </div>
  );
}

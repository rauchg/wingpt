import { useState, useEffect } from "react";
import { useDetectClickOutside } from "react-detect-click-outside";

import {
  AppBar,
  Frame,
  Button,
  MenuList,
  MenuListItem,
  Separator,
  Toolbar,
} from "react95";

export function StartBar({
  onChatOpen,
  onCreditsOpen,
}: {
  onChatOpen: () => void;
  onCreditsOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDetectClickOutside({ onTriggered: () => setOpen(false) });

  return (
    <AppBar position="fixed" style={{ top: "inherit", bottom: 0, zIndex: 2 }}>
      <Toolbar style={{ justifyContent: "space-between" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Button
            onClick={() => setOpen(!open)}
            active={open}
            style={{ display: "flex", gap: "0.2rem", fontWeight: "bold" }}
          >
            <VercelLogo />
            Start
          </Button>
          {open && (
            <MenuList
              ref={ref}
              style={{
                position: "absolute",
                left: "0",
                bottom: "100%",
                width: "20rem",
                display: "flex",
              }}
              onClick={() => setOpen(false)}
            >
              <div
                style={{
                  background: "linear-gradient(180deg, #000 0%, #555 100%)",
                  position: "relative",
                  width: "3rem",
                }}
              >
                <span
                  style={{
                    transform: "rotate(-90deg)",
                    color: "white",
                    position: "absolute",
                    display: "inline-block",
                    bottom: 45,
                    fontSize: "1.4rem",
                    left: -16,
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Win</span>GPT
                </span>
              </div>
              <div
                style={{
                  flexGrow: 1,
                }}
              >
                <MenuListItem
                  style={{
                    justifyContent: "start",
                    height: "3.5rem",
                    gap: "0.5rem",
                  }}
                  onClick={() => onChatOpen()}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: 'url("/icons/gpt.png")',
                      backgroundSize: "34px 34px",
                      // add some padding to the background
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                  WinGPT
                </MenuListItem>
                <MenuListItem
                  style={{
                    justifyContent: "start",
                    height: "3.5rem",
                    gap: "0.5rem",
                  }}
                  onClick={() =>
                    window.open("https://github.com/rauchg/wingpt")
                  }
                >
                  <img
                    src="/icons/folder.png"
                    alt="Source"
                    width={48}
                    height={48}
                  />
                  Source
                </MenuListItem>
                <Separator />
                <MenuListItem
                  style={{
                    justifyContent: "start",
                    height: "3.5rem",
                    gap: "0.5rem",
                  }}
                  onClick={() => onCreditsOpen()}
                >
                  <img
                    src="/icons/help.png"
                    alt="Credits"
                    width={48}
                    height={48}
                  />
                  Credits
                </MenuListItem>
              </div>
            </MenuList>
          )}
        </div>

        <Time />
      </Toolbar>
    </AppBar>
  );
}

function Time() {
  const [time, setTime] = useState<string | null>();
  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const interval = setInterval(
      () => setTime(new Date().toLocaleTimeString()),
      1000,
    );
    return () => clearInterval(interval);
  }, []);
  return time != null ? (
    <Frame
      variant="well"
      style={{ padding: "0 0.5rem", fontFeatureSettings: "tnum" }}
    >
      <span>{time}</span>
    </Frame>
  ) : null;
}

function VercelLogo() {
  return (
    <svg
      aria-label="Vercel logomark"
      role="img"
      viewBox="0 0 74 64"
      width={16}
      height={16}
    >
      <path
        d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z"
        fill="black"
      ></path>
    </svg>
  );
}

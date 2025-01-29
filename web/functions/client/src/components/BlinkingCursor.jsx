// @See: http://www.dynamicdrive.com/forums/showthread.php?17450-Emulating-a-terminal-like-caret-with-javascript-and-css&p=74576#post74576


import { useEffect, useState } from "react";

const BlinkingCursor = ({ blinking, style }) => {
  const [cursor, setCursor] = useState("█");
  useEffect(() => {
    if (blinking) {
      setTimeout(() => {
        if (cursor === "") setCursor("█");
        if (cursor === "█") setCursor("");
      }, 600);
    } else {
      setCursor("█");
    }
  }, [blinking, cursor]);
  return (
    <span
      style={{
        marginLeft: "4px",
        fontSize: "100%",
        ...style,
      }}
    >
      {cursor}
    </span>
  );
};

export default BlinkingCursor;

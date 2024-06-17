const HEX_ESC = '\x1b';

/* eslint-disable key-spacing */
export const ColorTypes = Object.freeze({
  Reset:         `${HEX_ESC}[0m`,
});

export const Colors = Object.freeze({
  // Text colors (foreground colors)
  Black:         `${HEX_ESC}[30m`,
  Blue:          `${HEX_ESC}[34m`,
  CoolYellow:    `${HEX_ESC}[38;2;175;175;151m`,
  Cyan:          `${HEX_ESC}[36m`,
  Gray:          `${HEX_ESC}[90m`,
  Green:         `${HEX_ESC}[32m`,
  Magenta:       `${HEX_ESC}[35m`,
  Orange:        `${HEX_ESC}[38;5;208m`,
  Pink:          `${HEX_ESC}[38;5;175m`,
  Purple:        `${HEX_ESC}[38;5;99m`,
  Red:           `${HEX_ESC}[31m`,
  White:         `${HEX_ESC}[37m`,
  Yellow:        `${HEX_ESC}[33m`,
});
/* eslint-enable key-spacing */

export default {
  ColorTypes,
  Colors,
};

/* eslint-disable no-console */
import { ColorTypes, Colors } from './ConsoleColors.js';

const { Reset } = ColorTypes;
const {
  // Cyan,
  Blue, Green, Magenta, Orange, Red, White, Yellow,
} = Colors;

export const runningScenarioMsg = ({ scenarioName, skip }) => console.log(`${
  skip ? `${Orange}Skipping` : `${Blue}Running`} ${
  Blue}scenario ${
  Green}${scenarioName.replace('__', `${Blue}. ${Magenta}`)}${
  Blue}...${
  Reset}`,
);

export const errorCreatingItemPacketMsg = (scenarioName, { id, __concessionName__, __name__ }) => {
  const name = __concessionName__ || __name__;
  console.error(`${
    Red}Error creating itemPacket ${
    Yellow}${id || ''}${
    name ? ` ${Red}(${Green}${name}${Red})` : ''}${
    Red}, scenario ${
    Yellow}${scenarioName.replace('__', `${Red}. ${Magenta}`)}${
    Reset}\n`);
};

export const validationErrorMsgs = (scenarioName, validationErrors) => {
  console.error(`  ${
    White}Validation Errors:${
    Reset}`);

  validationErrors.forEach((msg, index) => {
    console.error(`    ${
      White}${index + 1}. ${
      Red}${msg}${
      Reset}`);
  });
};

export const helloMsg = () => console.log(`\n${Colors.Yellow}Building test output files.${ColorTypes.Reset}\n`);

export const goodbyeMsg = () => console.log(`${Colors.Yellow}\nBuilds complete.${ColorTypes.Reset}\n`);

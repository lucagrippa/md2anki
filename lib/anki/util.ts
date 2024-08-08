import log from 'loglevel';
import * as crypto from "crypto";

// Define the base91 table used for encoding
const BASE91_TABLE: string[] = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s",
  "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
  "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4",
  "5", "6", "7", "8", "9", "!", "#", "$", "%", "&", "(", ")", "*", "+", ",", "-", ".", "/", ":",
  ";", "<", "=", ">", "?", "@", "[", "]", "^", "_", "`", "{", "|", "}", "~"
];

/**
 * Generates a GUID (Globally Unique Identifier) based on the input values.
 * This function mimics Anki's GUID generation algorithm.
 * 
 * @param values - Any number of values to be used in generating the GUID
 * @returns A string representing the generated GUID
 */
function generateGuidFor(...values: any[]): string {
  log.debug(`Generating GUID for values: ${values}`);
  // Join all input values into a single string
  const hashString: string = values.map(value => String(value)).join("__");

  // Create a SHA256 hash of the input string
  const hashBuffer: Buffer = crypto.createHash("sha256").update(hashString, "utf-8").digest();

  // Take the first 8 bytes of the hash and convert to a 64-bit integer
  const hashInt: bigint = getBigIntFromBuffer(hashBuffer.slice(0, 8));

  // Convert the integer to the base91 format that Anki uses
  return convertToBase91(hashInt);
}

/**
 * Converts a Buffer to a BigInt, treating the buffer as a big-endian 64-bit integer.
 * 
 * @param buffer - The Buffer to convert (should be 8 bytes)
 * @returns A BigInt representation of the buffer
 */
function getBigIntFromBuffer(buffer: Buffer): bigint {
  log.debug(`Converting buffer to BigInt: ${buffer.toString("hex")}`);
  if (buffer.length !== 8) {
    throw new Error("Buffer length must be 8 bytes for 64-bit integer conversion");
  }

  // Manual implementation of readBigUInt64BE
  let bigIntValue = BigInt(0);
  for (let i = 0; i < 8; i++) {
    bigIntValue = (bigIntValue << BigInt(8)) | BigInt(buffer[i]);
  }
  return bigIntValue;
  // return buffer.readBigUInt64BE(0);
}

/**
 * Converts a BigInt to a base91 string using the BASE91_TABLE.
 * 
 * @param value - The BigInt to convert
 * @returns A string in base91 format
 */
function convertToBase91(value: bigint): string {
  log.debug(`Converting BigInt to base91: ${value}`);
  const reversedResult: string[] = [];
  const base = BigInt(BASE91_TABLE.length);

  while (value > BigInt(0)) {
    const index = Number(value % base);
    reversedResult.push(BASE91_TABLE[index]);
    value = value / base;
  }

  return reversedResult.reverse().join("");
}

export { generateGuidFor };
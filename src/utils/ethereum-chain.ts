import { isPrefixedFormattedHexString, isSafeChainId } from "./network";
import { Hex, isValidHexAddress } from "@metamask/utils";

export const validateChainId = (chainId: string) => {
  const _chainId = chainId.toLowerCase();

  if (!isPrefixedFormattedHexString(_chainId)) {
    throw new Error(`Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`);
  }

  if (!isSafeChainId(parseInt(_chainId, 16))) {
    throw new Error(
      `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`
    );
  }

  return _chainId;
};

/**
 * Checks if an address is an ethereum one.
 *
 * @param address - An address.
 * @returns True if the address is an ethereum one, false otherwise.
 */
export const isEthAddress = (address: string): boolean => isValidHexAddress(address as Hex);

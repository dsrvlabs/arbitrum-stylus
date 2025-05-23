import { Bytes, FMT_BYTES, FMT_NUMBER, Web3 } from "web3";

const web3 = new Web3();

export const shortenAddress = ({
  address,
  etherBalance,
  chars = 4,
}: {
  address: string;
  etherBalance?: number;
  chars?: number;
}) => `${address.slice(0, chars)}...${address.slice(-chars)}${etherBalance ? `(${etherBalance} ETH)` : ""}`;

const pause = (ms: number = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

export const tryTillReceiptAvailable = async (
  txHash: string
): Promise<ReturnType<typeof web3.eth.getTransactionReceipt>> => {
  try {
    const receipt = await web3.eth.getTransactionReceipt(txHash, {
      number: FMT_NUMBER.NUMBER,
      bytes: FMT_BYTES.HEX,
    });
    if (receipt) {
      if (!receipt.to && !receipt.contractAddress) {
        return await tryTillReceiptAvailable(txHash);
      } else return receipt;
    }
  } catch (error) {
    /* empty */
  }
  await pause();
  return await tryTillReceiptAvailable(txHash);
};

export const tryTillTxAvailable = async (txhash: Bytes): Promise<ReturnType<typeof web3.eth.getTransaction>> => {
  try {
    const tx = await web3.eth.getTransaction(txhash, {
      number: FMT_NUMBER.NUMBER,
      bytes: FMT_BYTES.HEX,
    });
    if (tx?.blockHash) return tx;
    return tx;
  } catch (e) {
    /* empty */
  }
  await pause();
  return await tryTillTxAvailable(txhash);
};

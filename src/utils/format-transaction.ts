import React from "react"; // eslint-disable-line

export const RenderTransactionsAsString = ({
  status,
  nonce,
  from,
  to,
  value,
  logs,
  hash,
  gasUsed,
}: {
  status: string | number | bigint;
  nonce: string;
  from: string;
  to: string;
  value: string;
  logs: string;
  hash: string;
  gasUsed: string | number | bigint;
}) => {
  const logMessage = `
    [arbitrum] 
    Transaction Hash: ${hash}
    From: ${from}
    To: ${to}
    Value: ${value} wei
    Logs: ${logs}
    Gas Used: ${gasUsed} gas
    Nonce: ${nonce}
    Status: ${status ? "Succeeded" : "Failed"}
  `;
  return logMessage;
};

export const CallResultAsString = ({
  result,
  from,
  to,
  hash,
}: {
  result: Record<string, unknown>;
  from: string;
  to: string;
  hash: string;
}) => {
  // JSON.stringify에서 이상하게 변환되는 문제 해결을 위해 직접 처리
  const cleanResult = Object.keys(result)
    .map((key) => {
      return `${key}: ${result[key]}`;
    })
    .join(", ");

  const logMessage = `
    [call] 
    From: ${from}
    To: ${to}
    Hash: ${hash}
    Output: { ${cleanResult} }
  `;
  return logMessage;
};

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CSSTransition } from "react-transition-group";
import { FaCopy, FaExternalLinkAlt, FaTrashAlt } from "react-icons/fa";
import { renderToString } from "react-dom/server";
import { Accordion, Button, Card, Form, InputGroup, useAccordionButton } from "react-bootstrap";
import Web3, { AbiFragment, AbiFunctionFragment, AbiParameter } from "web3";
import copy from "copy-to-clipboard";
import { useShallow } from "zustand/react/shallow";

import { useStore } from "../../zustand";
import { ARBITRUM_NETWORK } from "../../const/network";
import { CallResultAsString, RenderTransactionsAsString } from "../../utils/format-transaction";
import { log } from "../../utils/logger";
import { LoaderWrapper } from "../common/loader";
import { shortenAddress } from "../../utils/transaction";

const isFunctionFragment = (abi: AbiFragment): abi is AbiFunctionFragment => abi.type === "function";

interface AbiExecuterProps {}
export const AbiExecuter = ({}: AbiExecuterProps) => {
  const { network, abi, contractAddresses, setContractAddresses } = useStore(
    useShallow((state) => ({
      network: state.account.network.data,
      abi: state.contract.abi,
      contractAddresses: state.contract.contractAddresses,
      setContractAddresses: state.contract.setContractAddresses,
    }))
  );
  const handleCssTransitionOnExited = (address: string) => {
    const addressesFiltered = contractAddresses.filter((item) => item !== address);
    setContractAddresses(addressesFiltered);
  };

  return (
    <div>
      {contractAddresses.map((address) => {
        const targetAbi = abi.get(address);
        if (!targetAbi) return null;

        return (
          <CSSTransition
            key={address}
            in={true}
            timeout={300}
            classNames="zoom"
            unmountOnExit
            onExited={() => handleCssTransitionOnExited(address)}
          >
            <Card className="mb-2">
              <Card.Header className="px-2 py-1">
                <strong className="align-middle">{targetAbi.name}</strong>
                &nbsp;
                <small className="align-middle">{shortenAddress({ address: targetAbi.address })}</small>
                <Button
                  className="float-right align-middle"
                  size="sm"
                  variant="link"
                  onClick={() => {
                    const targetNetwork = ARBITRUM_NETWORK.find((n) => n.chainId === network);
                    if (!targetNetwork) return;
                    window.open(`${targetNetwork.blockExplorerUrls}/address/${address}`);
                  }}
                >
                  <FaExternalLinkAlt />
                </Button>
                <Button
                  className="float-right align-middle"
                  size="sm"
                  variant="link"
                  onClick={() => handleCssTransitionOnExited(address)}
                >
                  <FaTrashAlt />
                </Button>
              </Card.Header>
              {targetAbi.abi.length > 0 && (
                <div>
                  {targetAbi.abi.map((abiItem, abiIndex) => {
                    if (isFunctionFragment(abiItem))
                      return (
                        <AccordionCard
                          key={`Methods_A_${abiIndex}`}
                          contractAddress={address}
                          abi={abiItem}
                          index={abiIndex}
                        />
                      );

                    return null;
                  })}
                </div>
              )}
            </Card>
          </CSSTransition>
        );
      })}
    </div>
  );
};

interface AccordionCardProps {
  abi: AbiFunctionFragment;
  index: number;
  contractAddress: string;
}
const AccordionCard = ({ abi, index, contractAddress }: AccordionCardProps) => {
  const { client, account, provider, contractLoading, setLoading } = useStore(
    useShallow((state) => ({
      client: state.global.client,
      account: state.account.address.data,
      provider: state.account.provider.data,
      contractLoading: state.contract.loading,
      setLoading: state.contract.setLoading,
    }))
  );
  const [value, setValue] = useState<string>("");
  const [args, setArgs] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<{ [key: string]: string }>({});

  const web3 = new Web3(provider!);

  const getReceiptRecursively = async (
    hash: string
  ): Promise<ReturnType<typeof web3.eth.getTransactionReceipt> | null> => {
    const getTransactionReceipt = async (hash: string) => {
      try {
        const txReceipt = await web3.eth.getTransactionReceipt(hash);
        return txReceipt;
      } catch (error) {
        return null;
      }
    };
    let txReceipt = await getTransactionReceipt(hash);

    return new Promise((resolve, reject) => {
      let MAX_RETRY = 5;
      const interval = setInterval(async () => {
        if (!txReceipt && MAX_RETRY > 0) {
          txReceipt = await getTransactionReceipt(hash);
          MAX_RETRY--;
        } else {
          clearInterval(interval);
          resolve(txReceipt);
        }
      }, 2_000);
    });
  };

  const getButtonVariant = (state: string = ""): string => {
    switch (state) {
      case "view":
      case "pure":
        return "primary";
      case "nonpayable":
        return "warning";
      case "payable":
        return "danger";
      default:
        break;
    }
    return "";
  };

  const handleCallOnClick = async () => {
    if (!account || !client) return;

    setLoading(true);
    setResult({});

    const parms: string[] = [];
    abi.inputs?.forEach((item) => {
      parms.push(args[item.name]);
    });
    const newContract = new web3.eth.Contract(JSON.parse(JSON.stringify([abi])), contractAddress);

    try {
      const txReceipt: any = abi.name ? await newContract.methods[abi.name](...parms).call({ from: account }) : null;

      if (Array.isArray(txReceipt) || typeof txReceipt !== "object") {
        abi.outputs?.forEach((output, index) => {
          const res = output.type + ": " + output.name + ": " + txReceipt;
          result[index.toString()] = res;
        });
        setValue(typeof txReceipt === "bigint" ? txReceipt.toString() : txReceipt);
      } else {
        abi.outputs?.forEach((output, index) => {
          const res = output.type + ": " + output.name + ": " + txReceipt[index.toString()];
          result[index.toString()] = res;
        });
      }
      const logString = CallResultAsString({
        result,
        from: contractAddress,
        to: abi.name === undefined ? "" : abi.name,
        hash: "asdf",
      });
      await client.call("terminal", "log", {
        type: "html",
        value: renderToString(logString),
      });
    } catch (e: any) {
      log.error(e);
      await client.terminal.log({ type: "error", value: e?.message?.toString() });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactOnClick = async () => {
    if (!account || !client || !provider) return;

    setLoading(true);
    setResult({});

    const parms: string[] = [];
    abi.inputs?.forEach((item) => {
      parms.push(args[item.name]);
    });
    const newContract = new web3.eth.Contract(JSON.parse(JSON.stringify([abi])), contractAddress);

    try {
      const hash = abi.name
        ? await provider.request<string>({
            method: "eth_sendTransaction",
            params: [
              {
                from: account,
                to: contractAddress,
                data: newContract.methods[abi.name](...parms).encodeABI(),
              },
            ],
          })
        : null;
      if (!hash) {
        throw new Error("Failed to get hash");
      }
      const receipt = await getReceiptRecursively(hash);
      if (!receipt) {
        throw new Error("Failed to get receipt");
      }

      const transaction = await web3.eth.getTransaction(hash);

      const logString = RenderTransactionsAsString({
        status: receipt.status,
        nonce: transaction.nonce,
        from: transaction.from,
        to: transaction.to === null ? "Conract " + receipt.contractAddress + " Created" : transaction.to ?? "",
        value: transaction.value,
        logs: receipt.logs.toString(),
        hash: transaction.hash,
        gasUsed: receipt.gasUsed,
      });

      await client.call("terminal", "log", { type: "html", value: logString });
    } catch (e: any) {
      log.error(e);
      await client?.terminal.log({ type: "error", value: e?.message?.toString() });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOnclick = async () => {
    if (!client) return;

    if (abi.name) {
      try {
        const parms: string[] = [];
        abi.inputs?.forEach((item) => {
          if (args[item.name]) {
            parms.push(args[item.name]);
          }
        });
        const newContract = new web3.eth.Contract(JSON.parse(JSON.stringify([abi])), contractAddress);
        copy(newContract.methods[abi.name](...parms).encodeABI());
      } catch (e: any) {
        log.error(e);
        await client.terminal.log({ type: "error", value: e?.message?.toString() });
      }
    }
  };

  useEffect(() => {
    const temp: { [key: string]: string } = {};
    abi.inputs?.forEach((element) => {
      temp[element.name] = "";
    });
    setArgs(temp);
  }, [abi.inputs]);

  return (
    <Accordion key={`Methods_A_${index}`}>
      <Accordion.Item as={Card.Header} eventKey={`Methods_${index}`} style={{ padding: "0" }}>
        <CustomToggle eventKey={`Methods_${index}`}>{abi.name}</CustomToggle>
        <Accordion.Collapse eventKey={`Methods_${index}`}>
          <Card.Body className="py-1 px-2">
            <Method abi={abi} setArgs={setArgs} />
            <br />
            <InputGroup className="mb-3">
              {getButtonVariant(abi.stateMutability) === "primary" ? (
                <Button
                  className="relative border-0"
                  variant={getButtonVariant(abi.stateMutability)}
                  size="sm"
                  disabled={contractLoading}
                  onClick={handleCallOnClick}
                >
                  call
                  <LoaderWrapper loading={contractLoading} />
                </Button>
              ) : (
                <Button
                  className="relative border-0"
                  variant={getButtonVariant(abi.stateMutability)}
                  size="sm"
                  disabled={contractLoading}
                  onClick={handleTransactOnClick}
                >
                  transact
                  <LoaderWrapper loading={contractLoading} />
                </Button>
              )}
              <Button
                variant={getButtonVariant(abi.stateMutability)}
                size="sm"
                className="mt-0 pt-0 float-right"
                onClick={handleCopyOnclick}
              >
                <FaCopy />
              </Button>

              <Form.Control
                value={value}
                size="sm"
                readOnly
                hidden={!(abi.stateMutability === "view" || abi.stateMutability === "pure")}
              />
            </InputGroup>
          </Card.Body>
        </Accordion.Collapse>
      </Accordion.Item>
    </Accordion>
  );
};

interface CustomToggleProps {
  children: React.ReactNode;
  eventKey: string;
}
const CustomToggle = ({ children, eventKey }: CustomToggleProps) => {
  const decoratedOnClick = useAccordionButton(eventKey, () => {});

  return (
    <div className="card-header" style={{ padding: "5px", borderBottom: "0.1px" }} onClick={decoratedOnClick}>
      <small>{children}</small>
    </div>
  );
};

interface MethodProps {
  abi: AbiFragment;
  setArgs: Dispatch<SetStateAction<{ [key: string]: string }>>;
}
const Method = ({ abi, setArgs }: MethodProps) => {
  const [inputs, setInputs] = useState<ReadonlyArray<AbiParameter>>([]);

  useEffect(() => {
    setInputs(abi && abi.inputs ? abi.inputs : []);
  }, [abi]);

  return (
    <Form className="Method">
      {inputs.map((item, index) => (
        <div key={index.toString()}>
          <Form.Text className="text-muted">
            <small>{item.name}</small>
          </Form.Text>
          <Form.Control
            type="text"
            size="sm"
            name={item.name}
            placeholder={item.type}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              if (event.target.value[0] === "[") {
                setArgs((prev) => ({
                  ...prev,
                  [event.target.name]: JSON.parse(event.target.value),
                }));
              } else {
                setArgs((prev) => ({
                  ...prev,
                  [event.target.name]: event.target.value,
                }));
              }
            }}
          />
        </div>
      ))}
    </Form>
  );
};

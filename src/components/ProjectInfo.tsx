import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { FaSyncAlt, FaExternalLinkAlt, FaTrashAlt, FaCopy } from "react-icons/fa";
import {
  Accordion,
  Alert,
  Button,
  Card,
  Form,
  InputGroup,
  OverlayTrigger,
  Tooltip,
  useAccordionButton,
} from "react-bootstrap";
import Web3, { AbiFragment, type AbiFunctionFragment, type AbiInput, type AbiItem } from "web3";
import axios from "axios";
import JSZip from "jszip";
import { CSSTransition } from "react-transition-group";
import { renderToString } from "react-dom/server";
import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";

import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import { InfoType, initButtonStatus, StatusType } from "./main";
import wrapPromise from "../utils/wrapPromise";
import { sendCustomEvent } from "../utils/sendCustomEvent";
import { log } from "../utils/logger";
import { CustomTooltip } from "./CustomTooltip";
import { FileInfo, FileUtil } from "../utils/FileUtil";
import { isEmptyList } from "../utils/ListUtil";
import { EditorClient } from "../utils/editor";
import { CHAIN_NAME } from "../const/chain";
import { io, type Socket } from "socket.io-client";
import {
  ARBITRUM_COMPILER_CONSUMER_API_ENDPOINT,
  ARBITRUM_COMPILER_CONSUMER_ENDPOINT,
  COMPILER_API_ENDPOINT,
} from "../const/endpoint";
import type { DisconnectDescription } from "socket.io-client/build/esm/socket";
import { cleanupSocketArbitrum } from "../utils/socket";
import {
  compileIdV2,
  COMPILER_ARBITRUM_COMPILE_COMPLETED_V1,
  COMPILER_ARBITRUM_COMPILE_ERROR_OCCURRED_V1,
  COMPILER_ARBITRUM_COMPILE_LOGGED_V1,
  CompilerArbitrumCompileCompletedV1,
  CompilerArbitrumCompileErrorOccurredV1,
  CompilerArbitrumCompileLoggedV1,
  REMIX_ARBITRUM_COMPILE_REQUESTED_V1,
  RemixArbitrumCompileRequestedV1,
} from "wds-event";
import { getPositionDetails, isRealError, stringify } from "../const/helper";
import stripAnsi from "strip-ansi";
import BigNumber from "bignumber.js";
import { S3Path } from "../const/s3-path";
import { BUILD_FILE_TYPE } from "../const/build-file-type";
import { delay } from "../utils/waitForTransaction";
import { CallResult, CallResultAsString, RenderTransactions, RenderTransactionsAsString } from "./RenderTransactions";
import AlertCloseButton from "./AlertCloseButton";
import Method from "./Method";
import copy from "copy-to-clipboard";

const RCV_EVENT_LOG_PREFIX = `[==> EVENT_RCV]`;
const SEND_EVENT_LOG_PREFIX = `[EVENT_SEND ==>]`;
const TEMPLATE_LIST = ["hello-world", "erc20", "erc721", "single_call", "vending_machine"];
const ACTIVATION_TO_ADDR = "0x0000000000000000000000000000000000000071";
const initialProjectInfo = {
  project: "",
  projectList: [],
  compileTarget: "",
  contractAbiMap: new Map<string, AbiItem[]>(),
  template: TEMPLATE_LIST[0],
  fileName: "",
  timestamp: "",
  contractAddress: "",
  contractName: "",
  contracts: [],
  contract: { name: "", address: "", abi: [] },
  isUploadCode: true,
  dataFee: "",
  deploymentTx: "",
  atAddress: "",
};

const isFunctionFragment = (abi: AbiFragment): abi is AbiFunctionFragment => abi.type === "function";

export interface InterfaceContract {
  name: string;
  address: string;
  abi: AbiItem[];
}

export interface ArbitrumContractCreateDto {
  chainId: string;
  account: string;
  address: string;
  compileTimestamp: number;
  deployTimestamp: number;
  txHash: string;
  isSrcUploaded: boolean;
  status: string;
  cliVersion: string | null;
}

export interface ArbitrumContractUpdateDto {
  chainId: string;
  address: string;
  activationHash: string;
  activationTimestamp: number;
}

interface ProjectInfoProps {
  client: Client<Api, Readonly<IRemixApi>>;
  info: Exclude<InfoType, null>;
  setInfo: Dispatch<SetStateAction<InfoType>>;
  status: StatusType;
  setStatus: Dispatch<SetStateAction<StatusType>>;
  setAlert: Dispatch<SetStateAction<string | null>>;
}
export const ProjectInfo = ({ client, info, setInfo, status, setStatus, setAlert }: ProjectInfoProps) => {
  const { ethereum } = window;
  const web3 = new Web3(ethereum);

  const [projectInfo, setProjectInfo] = useState<{
    project: string;
    projectList: string[];
    compileTarget: string;
    contractAbiMap: Map<string, AbiItem[]>;
    template: string;
    fileName: string;
    timestamp: string;
    contractAddress: string;
    contractName: string;
    contracts: InterfaceContract[];
    contract: InterfaceContract;
    isUploadCode: boolean;
    dataFee: string;
    deploymentTx: string;
    atAddress: string;
  }>(initialProjectInfo);

  const handleNetwork = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === event.target.value);
    if (!targetNetwork) return;
    setProjectInfo(initialProjectInfo);
    setStatus((prev) => ({ ...prev, metamask: initButtonStatus }));
    setInfo({ account: "", balance: "", network: targetNetwork.chainId });
  };

  const handleProjectName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectInfo((prev) => ({ ...prev, project: event.target.value }));
  };

  const handleTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectInfo((prev) => ({ ...prev, template: event.target.value }));
  };

  const handleTargetProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectInfo((prev) => ({ ...prev, compileTarget: event.target.value }));
  };

  const handleUploadCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectInfo((prev) => ({ ...prev, isUploadCode: event.target.checked }));
  };

  const handleAtAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectInfo((prev) => ({ ...prev, atAddress: event.target.value }));
  };

  const getList = async () => {
    const projects = await getProjectHaveTomlFile("browser/arbitrum");
    setProjectInfo((prev) => ({ ...prev, projectList: projects }));
    if (projects?.length > 0) {
      const targetProjects = projects.find((item) => item.includes(projectInfo.template));
      const compileTarget = targetProjects ? targetProjects : projects[0];
      setProjectInfo((prev) => ({ ...prev, compileTarget }));
      try {
        // const abiStr = await client?.fileManager.readFile("browser/arbitrum/abi.json");
        setProjectInfo((prev) => ({ ...prev, contractAbiMap: new Map(prev.contractAbiMap) }));
      } catch (e) {
        console.log(`No abi.json. Writing empty abi.`);
        await client?.fileManager.writeFile("browser/arbitrum/abi.json", "[]");
        setProjectInfo((prev) => ({ ...prev, contractAbiMap: new Map(prev.contractAbiMap) }));
      }
    }
  };

  const wrappedGetList = () => wrapPromise(getList(), client);

  const getProjectHaveTomlFile = async (path: string): Promise<string[]> => {
    if (!client) return [];

    const projects: string[] = [];

    const findTomlFileRecursively = async (currentPath: string): Promise<void> => {
      const list = await client.fileManager.readdir(currentPath);
      const hasTomlFile = Object.keys(list).some((item) => item.endsWith("Cargo.toml"));
      if (hasTomlFile) {
        projects.push(currentPath.replace("browser/", ""));
      }

      for (const [key, value] of Object.entries(list)) {
        if ((value as any).isDirectory) {
          const additionalPath = key.split("/").pop();
          await findTomlFileRecursively(currentPath + "/" + additionalPath);
        }
      }
    };

    await findTomlFileRecursively(path);

    return projects;
  };

  const createProject = async () => {
    sendCustomEvent("new_project", {
      event_category: "arbitrum",
      method: "new_project",
    });
    if (await wrappedIsExists(projectInfo.project)) {
      await client.terminal.log({
        type: "error",
        value: 'The folder "arbitrum/' + projectInfo.project + '" already exists',
      });
      return;
    }

    try {
      const path = "browser/arbitrum/" + projectInfo.project;
      await client?.fileManager.mkdir(path + "/src");
      await client?.fileManager.mkdir(path + "/examples");
      await client?.fileManager.mkdir(path + "/.cargo/config");
      await client?.fileManager.writeFile(path + "/Cargo.toml", "");
      getList();
    } catch (e: any) {
      await client.terminal.log(e.message);
    }
  };

  const wrappedCreateProject = () => wrapPromise(createProject(), client);

  const isExists = async (dir: string) => {
    try {
      log.debug(await client.fileManager.readdir("browser/arbitrum/" + dir));
      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  };

  const wrappedIsExists = (dir: string) => wrapPromise(isExists(dir), client);

  const createTemplate = async () => {
    sendCustomEvent("create_template", {
      event_category: "arbitrum",
      method: "create_template",
    });

    if (await wrappedIsExists(projectInfo.template)) {
      await client.terminal.log({
        type: "error",
        value: `The folder "arbitrum/${projectInfo.template} already exists`,
      });
      return;
    }

    const res = await axios.request({
      method: "GET",
      url:
        `https://api.welldonestudio.io/compiler/s3Proxy?bucket=code-template&fileKey=arbitrum/` +
        projectInfo.template +
        ".zip",
      responseType: "arraybuffer",
      responseEncoding: "null",
    });

    const jsZip = new JSZip();
    const zip = await jsZip.loadAsync(res.data);

    let content: any;
    try {
      Object.keys(zip.files).map(async (key) => {
        log.debug(`@@@ key=${key}`);
        if (zip.files[key].dir) {
          await client?.fileManager.mkdir("browser/arbitrum/" + key);
        } else if (!key.startsWith("_") && key !== projectInfo.template + "/.DS_Store") {
          content = await zip.file(key)?.async("string");
          await client?.fileManager.writeFile("browser/arbitrum/" + key, content);
        }
      });
      await wrappedGetList();
      await client.terminal.log({ type: "info", value: projectInfo.template + " is created successfully." });
    } catch (e) {
      log.error(e);
    }
  };

  const wrappedCreateTemplate = () => wrapPromise(createTemplate(), client);

  const handleCompile = async () => {
    if (status.compile.loading) {
      client.terminal.log({ value: "Server is working...", type: "log" });
      return;
    }

    setStatus((prev) => ({
      ...prev,
      compile: { ...initButtonStatus, loading: true },
    }));
    log.info(`removeArtifacts ${"browser/" + projectInfo.compileTarget + "/output"}`);
    try {
      await client?.fileManager.remove("browser/" + projectInfo.compileTarget + "/output");
    } catch (e) {
      log.info(`no out folder`);
    }

    let projFiles = await FileUtil.allFilesForBrowser(client, projectInfo.compileTarget);
    log.info(`@@@ compile compileTarget=${projectInfo.compileTarget}, projFiles=${JSON.stringify(projFiles, null, 2)}`);
    if (isEmptyList(projFiles)) {
      return;
    }

    const rustToolchainFile = projFiles.find((f) => f.path === `${projectInfo.compileTarget}/rust-toolchain.toml`);
    if (!rustToolchainFile) {
      client.terminal.log({
        type: "warn",
        value: `Not found "rust-toolchain.toml". Added default "rust-toolchain.toml".`,
      });
      const rustToolchainContent = `[toolchain]\nchannel = "1.80.0"`;
      await client.fileManager.writeFile(
        `browser/${projectInfo.compileTarget}/rust-toolchain.toml`,
        rustToolchainContent
      );
      projFiles = await FileUtil.allFilesForBrowser(client, projectInfo.compileTarget);
      log.info(
        `@@@ compile compileTarget=${projectInfo.compileTarget}, refresh projFiles=${JSON.stringify(
          projFiles,
          null,
          2
        )}`
      );
    }

    const blob = await generateZip(projFiles);
    if (!blob) {
      return;
    }

    await compile(blob, projFiles);
  };

  const generateZip = async (fileInfos: Array<FileInfo>) => {
    const zip = new JSZip();

    await Promise.all(
      fileInfos.map(async (fileinfo: FileInfo) => {
        if (fileinfo.path.startsWith(`${projectInfo.compileTarget}/artifacts`)) {
          return;
        }

        if (fileinfo.path.startsWith(`${projectInfo.compileTarget}/schema`)) {
          return;
        }

        if (!fileinfo.isDirectory) {
          const content = await client?.fileManager.readFile(fileinfo.path);
          const f = createFile(content || "", fileinfo.path.substring(fileinfo.path.lastIndexOf("/") + 1));
          const chainFolderExcluded = fileinfo.path.substring(fileinfo.path.indexOf("/") + 1);
          const projFolderExcluded = chainFolderExcluded.substring(chainFolderExcluded.indexOf("/") + 1);
          zip.file(projFolderExcluded, f);
        }
      })
    );
    return await zip.generateAsync({ type: "blob" });
  };

  const createFile = (code: string, name: string) => {
    const blob = new Blob([code], { type: "text/plain" });
    return new File([blob], name, { type: "text/plain" });
  };

  const compile = async (blob: Blob, projFiles: FileInfo[]) => {
    setStatus((prev) => ({
      ...prev,
      compile: { ...initButtonStatus, loading: true },
    }));
    const editorClient = new EditorClient(client);
    await editorClient.discardHighlight();
    await editorClient.clearAnnotations();

    const timestamp = Date.now().toString();
    setProjectInfo((prev) => ({ ...prev, timestamp }));

    // ------------------------------------------------------------------
    try {
      const isSrcZipUploadSuccess = await FileUtil.uploadSrcZip({
        chainName: CHAIN_NAME.arbitrum,
        chainId: info.network,
        account: info.account || "noaddress",
        timestamp: timestamp.toString() || "0",
        fileType: "arbitrum",
        zipFile: blob,
      });
      if (!isSrcZipUploadSuccess) {
        log.error(`src zip upload fail. address=${info.account}, timestamp=${timestamp}`);
        setStatus((prev) => ({
          ...prev,
          compile: { ...initButtonStatus, error: true },
        }));
        return;
      }
    } catch (e) {
      log.error(`src zip upload fail. address=${info.account}, timestamp=${timestamp}`);
      setStatus((prev) => ({
        ...prev,
        compile: { ...initButtonStatus, error: true },
      }));
      client.terminal.log({ type: "error", value: `compile error.` });
      return;
    }

    const projFiles_ = projFiles
      .filter((fileinfo) => {
        if (fileinfo.path === `${projectInfo.compileTarget}/output` && fileinfo.isDirectory) {
          return false;
        }

        if (fileinfo.path.startsWith(`${projectInfo.compileTarget}/output/`)) {
          return false;
        }

        return true;
      })
      .map((pf) => ({
        path: pf.path.replace(projectInfo.compileTarget + "/", ""),
        isDirectory: pf.isDirectory,
      }));
    const uploadUrls = await FileUtil.uploadUrls({
      chainName: CHAIN_NAME.arbitrum,
      chainId: info.network,
      account: info.account || "noaddress",
      timestamp: timestamp.toString() || "0",
      projFiles: projFiles_,
    });

    if (uploadUrls.length === 0) {
      log.error(`uploadUrls fail`);
      setStatus((prev) => ({
        ...prev,
        compile: { ...initButtonStatus, error: true },
      }));
      return;
    }

    const contents = await FileUtil.contents(client.fileManager, projectInfo.compileTarget, projFiles_);

    const socket = io(ARBITRUM_COMPILER_CONSUMER_ENDPOINT, {
      reconnection: false,
      transports: ["websocket"],
      timeout: 120_000,
    });

    try {
      socket.on("connect_error", function (err) {
        // handle server error here
        log.debug("Error connecting to server");
        setStatus((prev) => ({
          ...prev,
          compile: { ...initButtonStatus, error: true },
        }));
        socket.disconnect();
      });

      socket.on("connect", async () => {});

      socket.on("disconnect", (reason: Socket.DisconnectReason, description?: DisconnectDescription) => {
        log.info("[SOCKET.ARBITRUM] disconnected.", reason, description);
        setStatus((prev) => ({
          ...prev,
          compile: initButtonStatus,
        }));
        log.info(`@@@ after disconnect. disconnected=${socket.disconnected}`);
        cleanupSocketArbitrum(socket);
      });

      socket.on("connect_error", async function (err) {
        // handle server error here
        log.info("[SOCKET.ARBITRUM] Error connecting to server");
        log.error(err);
        setStatus((prev) => ({
          ...prev,
          compile: { ...initButtonStatus, error: true },
        }));
        log.info(`@@@ after connect_error. disconnected=${socket.disconnected}`);
        cleanupSocketArbitrum(socket);
        client.terminal.log({
          type: "error",
          value: `${err.message}`,
        });
      });

      socket.on(COMPILER_ARBITRUM_COMPILE_ERROR_OCCURRED_V1, async (data: CompilerArbitrumCompileErrorOccurredV1) => {
        if (!projectInfo.isUploadCode) {
          try {
            await axios.request({
              method: "DELETE",
              url: `${COMPILER_API_ENDPOINT}/s3Proxy`,
              params: {
                chainName: CHAIN_NAME.arbitrum,
                chainId: info.network,
                account: info.account,
                timestamp: timestamp.toString() || "0",
              },
              responseType: "arraybuffer",
              responseEncoding: "null",
            });
          } catch (e) {
            console.log(`Failed to delete.`);
          }
        }

        log.info(`${RCV_EVENT_LOG_PREFIX} ${COMPILER_ARBITRUM_COMPILE_ERROR_OCCURRED_V1} data=${stringify(data)}`);
        if (data.compileId !== compileIdV2(CHAIN_NAME.arbitrum, info.network, info.account, timestamp)) {
          return;
        }
        client.terminal.log({ type: "error", value: data.errMsg.toString() });

        socket.disconnect();
        cleanupSocketArbitrum(socket);
      });

      socket.on(COMPILER_ARBITRUM_COMPILE_LOGGED_V1, async (data: CompilerArbitrumCompileLoggedV1) => {
        log.info(`${RCV_EVENT_LOG_PREFIX} ${COMPILER_ARBITRUM_COMPILE_LOGGED_V1} data=${stringify(data)}`);
        if (data.compileId !== compileIdV2(CHAIN_NAME.arbitrum, info.network, info.account, timestamp)) {
          return;
        }

        client.terminal.log({ type: "info", value: stripAnsi(data.logMsg) });

        if (data.logMsg.includes("error")) {
          const { file, annotation, highlightPosition, positionDetail } = getPositionDetails(data.logMsg);

          if (file) {
            if (isRealError(annotation)) {
              // await editorClient.switchFile(`${compileTarget}/${file}`);
              await editorClient.addAnnotation(annotation);
              await editorClient.gotoLine(positionDetail.row, positionDetail.col);
              // await editorClient.highlight(
              //   highlightPosition,
              //   `${compileTarget}/${file}`,
              //   '#ff7675',
              // );

              setAlert((prev) => `${prev}\n${data.logMsg}`);
              setStatus((prev) => ({
                ...prev,
                compile: { ...initButtonStatus, error: true },
              }));
              socket.disconnect();
              return;
            }
          }
        }

        console.log("logMsg", data.logMsg);
        if (data.logMsg.includes("wasm data fee:")) {
          // setIsReadToActivate(true);
          setStatus((prev) => ({
            ...prev,
            compile: initButtonStatus,
            activate: { ...initButtonStatus, ready: true },
          }));
          const msg = stripAnsi(data.logMsg);
          console.log(`msg=${msg}`);
          const idx = msg.indexOf("Ξ");
          const lineFeedIdx = msg.indexOf("\n");
          const dataFee = msg.slice(idx + 1, lineFeedIdx);
          const web3 = new Web3();
          const wei = web3.utils.toWei(dataFee, "ether");
          const finalWei = new BigNumber(wei).multipliedBy(120).div(100).toNumber();
          const hex = web3.utils.toHex(finalWei);
          console.log(
            `idx=${idx}, lineFeedIdx=${lineFeedIdx}, dataFee=${dataFee}, wei=${wei}, finalWei=${finalWei}, finalWetStr=${finalWei.toString()}, hex=${hex}`
          );

          setProjectInfo((prev) => ({ ...prev, dataFee: hex }));
        }
      });

      socket.on(COMPILER_ARBITRUM_COMPILE_COMPLETED_V1, async (data: CompilerArbitrumCompileCompletedV1) => {
        socket.disconnect();

        log.info(`${RCV_EVENT_LOG_PREFIX} ${COMPILER_ARBITRUM_COMPILE_COMPLETED_V1} data=${stringify(data)}`);
        if (data.compileId !== compileIdV2(CHAIN_NAME.arbitrum, info.network, info.account, timestamp)) {
          return;
        }

        const res = await axios.request({
          method: "GET",
          url: `${COMPILER_API_ENDPOINT}/s3Proxy`,
          params: {
            bucket: S3Path.bucket(),
            fileKey: S3Path.outKey(CHAIN_NAME.arbitrum, info.network, info.account, timestamp, BUILD_FILE_TYPE.rs),
          },
          responseType: "arraybuffer",
          responseEncoding: "null",
        });

        if (!projectInfo.isUploadCode) {
          console.log(`Delete source files.`);
          try {
            await axios.request({
              method: "DELETE",
              url: `${COMPILER_API_ENDPOINT}/s3Proxy`,
              params: {
                chainName: CHAIN_NAME.arbitrum,
                chainId: info.network,
                account: info.account,
                timestamp: timestamp,
              },
              responseType: "arraybuffer",
              responseEncoding: "null",
            });
          } catch (e) {
            console.log(`Failed to delete.`);
          }
        }

        const zip = await new JSZip().loadAsync(res.data);

        try {
          await Promise.all(
            Object.keys(zip.files).map(async (filename) => {
              log.info(`arbitrum build result filename=${filename}`);
              if (filename.endsWith("output/deployment_tx_data.txt")) {
                const fileData = await zip.files[filename].async("blob");
                const hex = Buffer.from(await fileData.arrayBuffer()).toString("hex");
                await client?.fileManager.writeFile("browser/" + projectInfo.compileTarget + "/" + filename, hex);
                setProjectInfo((prev) => ({ ...prev, deploymentTx: hex, fileName: filename }));
              } else if (filename.endsWith("output/activation_tx_data.txt")) {
                const fileData = await zip.files[filename].async("blob");
                const hex = Buffer.from(await fileData.arrayBuffer()).toString("hex");
                await client?.fileManager.writeFile("browser/" + projectInfo.compileTarget + "/" + filename, hex);
              } else {
                const fileData = await zip.files[filename].async("string");
                if (filename === "output/abi.json") {
                  const abi = JSON.parse(fileData) as AbiItem[];
                  console.log(`@@@ saved output/abi.json abi=${JSON.stringify(abi)}`, abi);
                  // setAbi(abi);
                  // setSelected({
                  //   name: '',
                  //   address: '',
                  //   abi: abi.filter((a) => a.type === 'function'),
                  // });
                  client.terminal.log({
                    type: "info",
                    value: `======================== ABI ========================`,
                  });
                  client.terminal.log({
                    type: "info",
                    value: `${JSON.stringify(abi, null, 2)}`,
                  });
                }

                await client?.fileManager.writeFile("browser/" + projectInfo.compileTarget + "/" + filename, fileData);
              }
            })
          );

          const projFiles = await FileUtil.allFilesForBrowser(client, projectInfo.compileTarget);
          log.info(
            `@@@ compile compileTarget=${projectInfo.compileTarget}, projFiles=${JSON.stringify(projFiles, null, 2)}`
          );
          client.terminal.log({
            type: "info",
            value: `\nBuild Completed.`,
          });
        } catch (e) {
          log.error(e);
        } finally {
          setStatus((prev) => ({
            ...prev,
            compile: initButtonStatus,
          }));
        }
      });

      const remixArbitrumCompileRequestedV1: RemixArbitrumCompileRequestedV1 = {
        compileId: compileIdV2(CHAIN_NAME.arbitrum, info.network, info.account, timestamp),
        chainName: CHAIN_NAME.arbitrum,
        chainId: info.network,
        address: info.account || "noaddress",
        timestamp: timestamp.toString() || "0",
        fileType: "arbitrum",
      };

      socket.emit(REMIX_ARBITRUM_COMPILE_REQUESTED_V1, remixArbitrumCompileRequestedV1);
      log.info(
        `${SEND_EVENT_LOG_PREFIX} ${REMIX_ARBITRUM_COMPILE_REQUESTED_V1} data=${stringify(
          remixArbitrumCompileRequestedV1
        )}`
      );
    } catch (e) {
      log.error(e);
      setStatus((prev) => ({
        ...prev,
        compile: { ...initButtonStatus, error: true },
      }));
    }
  };

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
      let MAX_RETRY = 3;
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

  const handleDeploy = async () => {
    try {
      if (status.deploy.loading) {
        client.terminal.log({ value: "Server is working...", type: "log" });
        return;
      }
      if (!ethereum || !ethereum.isMetaMask) {
        setAlert("MetaMask is not installed. Please install MetaMask to continue.");
        setStatus((prev) => ({ ...prev, metamask: initButtonStatus }));
        return;
      }

      if (projectInfo.deploymentTx === "") {
        client.terminal.log({ type: "error", value: `No deployment tx data` });
        return;
      }
      setStatus((prev) => ({
        ...prev,
        deploy: { ...initButtonStatus, loading: true },
      }));
      let hash;
      try {
        hash = await ethereum.request<string>({
          method: "eth_sendTransaction",
          params: [
            {
              from: info.account,
              data: `0x${projectInfo.deploymentTx}`,
            },
          ],
        });
      } catch (e) {
        console.error(e);
        setStatus((prev) => ({
          ...prev,
          deploy: { ...initButtonStatus, error: true },
        }));
        return;
      }
      if (!hash) {
        setStatus((prev) => ({
          ...prev,
          deploy: initButtonStatus,
        }));
        return;
      }

      const tx = await web3.eth.getTransaction(hash);
      client.terminal.log({
        type: "info",
        value: "========================= deployment tx ===========================",
      });
      // JSON.stringify에서 BigInt 처리
      client.terminal.log({
        type: "info",
        value: JSON.stringify(tx, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2),
      });

      let txReceipt = await getReceiptRecursively(hash);
      if (!txReceipt) {
        client.terminal.log({
          type: "error",
          value: `Failed to get deployment tx receipt for hash=${hash}`,
        });
        setStatus((prev) => ({
          ...prev,
          deploy: initButtonStatus,
        }));
        return;
      }
      setProjectInfo((prev) => ({
        ...prev,
        contractAddress: txReceipt!.contractAddress || "",
      }));
      if (txReceipt.contractAddress && txReceipt.status) {
        const abiStr = await client?.fileManager.readFile("browser/" + projectInfo.compileTarget + "/output/abi.json");
        const abiItems = JSON.parse(abiStr) as AbiItem[];
        setProjectInfo((prev) => ({
          ...prev,
          contractAbiMap: new Map(prev.contractAbiMap.set(txReceipt!.contractAddress!.toLowerCase(), abiItems)),
        }));
        const contract = new web3.eth.Contract(abiItems, txReceipt.contractAddress);
        let name: string = "";
        try {
          name = await contract.methods.name().call();
          setProjectInfo((prev) => ({ ...prev, contractName: name }));
        } catch (error) {
          // console.error("Error interacting with contract:", error);
        }
        // if (status.activate.ready || isActivated) {
        if (status.activate.ready) {
          // setContractAddr(txReceipt.contractAddress || "");
          // addNewContract({
          //   name: name,
          //   abi: abiItems,
          //   address: txReceipt.contractAddress,
          // });
          const contractAddress = txReceipt.contractAddress || "";
          const contractFiltered = projectInfo.contracts.filter(
            (c) => c.address.toString() !== contractAddress.toString()
          );
          setProjectInfo((prev) => ({
            ...prev,
            contractAddress: contractAddress || "",
            contracts: contractFiltered.concat({ name: name, address: contractAddress, abi: abiItems }),
          }));
        }
        let deploymentTimeStamp = 0;
        if (txReceipt.blockNumber) {
          const block = await web3.eth.getBlock(txReceipt.blockNumber);
          if (block) {
            deploymentTimeStamp = Number(block.timestamp) * 1000;
          }
        }
        const arbitrumContractCreateDto: ArbitrumContractCreateDto = {
          chainId: info.network,
          account: info.account,
          address: txReceipt.contractAddress,
          compileTimestamp: Number(projectInfo.timestamp),
          deployTimestamp: deploymentTimeStamp || 0,
          txHash: hash,
          isSrcUploaded: projectInfo.isUploadCode,
          status: txReceipt.status ? "true" : "false",
          cliVersion: null, // todo
        };
        log.info("arbitrumContractCreateDto", arbitrumContractCreateDto);
        try {
          const res = await axios.post(COMPILER_API_ENDPOINT + "/arbitrum/contracts", arbitrumContractCreateDto);
          log.info(`put arbitrum/contracts api res`, res);
        } catch (e) {
          log.error(`put arbitrum/contracts api error`);
          console.error(e);
        }
        setStatus((prev) => ({
          ...prev,
          deploy: initButtonStatus,
        }));
      }
      client.terminal.log({
        type: "info",
        value: "====================== deployment tx receipt ======================",
      });
      client.terminal.log({
        type: "info",
        value: JSON.stringify(txReceipt, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2),
      });
    } catch (error) {
      console.log(error);
      setStatus((prev) => ({
        ...prev,
        deploy: { ...initButtonStatus, error: true },
        activate: initButtonStatus,
      }));
    } finally {
      setStatus((prev) => ({
        ...prev,
        deploy: initButtonStatus,
      }));
    }
  };

  const handleActivate = async () => {
    if (status.activate.loading) {
      client.terminal.log({ value: "Server is working...", type: "log" });
      return;
    }
    if (!ethereum || !ethereum.isMetaMask) {
      setAlert("MetaMask is not installed. Please install MetaMask to continue.");
      setStatus((prev) => ({ ...prev, metamask: initButtonStatus }));
      return;
    }
    // setStatus((prev) => ({
    //   ...prev,
    //   activate: { ...prev.activate, loading: true },
    // }));
    if (!projectInfo.contractAddress) {
      console.log(`No contractAddr`);
      // setStatus((prev) => ({
      //   ...prev,
      //   activate: initButtonStatus,
      // }));
      return;
    }
    const abiItems = projectInfo.contractAbiMap.get(projectInfo.contractAddress.toLowerCase());
    if (!abiItems) {
      // setStatus((prev) => ({
      //   ...prev,
      //   activate: initButtonStatus,
      // }));
      return;
    }
    let tx = "";
    try {
      const res = await axios.get(
        ARBITRUM_COMPILER_CONSUMER_API_ENDPOINT + `/arbitrum/activation-tx?contractAddr=${projectInfo.contractAddress}`
      );
      tx = res.data?.tx;
      if (!tx) {
        await client.terminal.log({
          type: "info",
          value: `Failed to get activation tx for contract ${projectInfo.contractAddress}`,
        });
        // setIsLoading(false);
        // setStatus((prev) => ({
        //   ...prev,
        //   activate: initButtonStatus,
        // }));
        return;
      }
    } catch (e) {
      // setStatus((prev) => ({
      //   ...prev,
      //   activate: { ...initButtonStatus, error: true },
      // }));
      return;
    }

    let activation_hash;
    try {
      activation_hash = await ethereum.request<string>({
        method: "eth_sendTransaction",
        params: [
          {
            from: info.account,
            to: ACTIVATION_TO_ADDR,
            data: tx,
            value: projectInfo.dataFee,
          },
        ],
      });
      console.log(`@@@ activation_hash`, activation_hash);
    } catch (e) {
      // setStatus((prev) => ({
      //   ...prev,
      //   activate: { ...initButtonStatus, error: true },
      // }));
      return;
    }
    if (!activation_hash) return;

    const activation_tx = await web3.eth.getTransaction(activation_hash);
    client.terminal.log({
      type: "info",
      value: "========================= activation tx ===========================",
    });

    client.terminal.log({
      type: "info",
      value: JSON.stringify(activation_tx, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2),
    });
    let activation_txReceipt = await getReceiptRecursively(activation_hash);

    if (!activation_txReceipt) {
      client.terminal.log({
        type: "error",
        value: `Failed to get activation tx receipt for hash=${activation_hash}`,
      });
      return;
    }
    console.log("activation_txReceipt.status", activation_txReceipt.status);
    if (activation_txReceipt.status) {
      // setIsActivated(true);
      const contract = new web3.eth.Contract(abiItems, projectInfo.contractAddress);
      let name = "";
      try {
        name = await contract.methods.name().call();
        console.log("Contract Name:", name);
      } catch (error) {
        console.error("Error interacting with contract:", error);
      }
      setProjectInfo((prev) => {
        const contractFiltered = prev.contracts.filter(
          (c) => c.address.toString() !== projectInfo.contractAddress.toString()
        );
        return {
          ...prev,
          contractAddress: projectInfo.contractAddress,
          contracts: contractFiltered.concat({ name: name, address: projectInfo.contractAddress, abi: abiItems }),
        };
      });
      let activationTimestamp = 0;
      if (activation_txReceipt.blockNumber) {
        const block = await web3.eth.getBlock(activation_txReceipt.blockNumber);
        if (block) {
          activationTimestamp = Number(block.timestamp) * 1000;
        }
      }
      const arbitrumContractUpdateDto: ArbitrumContractUpdateDto = {
        chainId: info.network,
        address: projectInfo.contractAddress,
        activationHash: activation_hash,
        activationTimestamp: activationTimestamp || 0,
      };
      log.info("arbitrumContractUpdateDto", arbitrumContractUpdateDto);
      try {
        const res = await axios.put(COMPILER_API_ENDPOINT + "/arbitrum/contracts", arbitrumContractUpdateDto);
        log.info(`put arbitrum/contracts api res`, res);
      } catch (e) {
        log.error(`put arbitrum/contracts api error`);
      }
    }
    console.log("12");
    client.terminal.log({
      type: "info",
      value: "====================== activation tx receipt ======================",
    });
    client.terminal.log({ type: "info", value: JSON.stringify(activation_txReceipt, null, 2) });
    // setStatus((prev) => ({
    //   ...prev,
    //   activate: initButtonStatus,
    // }));
    return;
  };

  useEffect(() => {
    getList();
  }, [info]);

  useEffect(() => {
    console.log(status.activate);
  }, [status]);

  console.log("rerender", projectInfo);

  return (
    <div className="flex flex-col gap-3">
      <Form className="flex flex-col gap-2">
        <Form.Group>
          <Form.Label>Network</Form.Label>
          <Form.Control
            as="select"
            value={info.network}
            defaultValue={ARBITRUM_ONE.chainId}
            onChange={handleNetwork}
            size="sm"
          >
            {ARBITRUM_NETWORK.map((network, idx) => (
              <option key={idx} value={network.chainId}>
                {network.chainName}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group>
          <Form.Label>Account</Form.Label>
          <InputGroup>
            <Form.Control type="text" placeholder="Account" value={info.account} size="sm" readOnly />
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Label>Balance</Form.Label>
          <InputGroup>
            <Form.Control type="text" placeholder="Balance" value={info.balance} size="sm" readOnly />
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Label>New Project</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Project Name"
              size="sm"
              onChange={handleProjectName}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
            <Button variant="success" size="sm" onClick={wrappedCreateProject}>
              <small>Create</small>
            </Button>
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Label>Select a Template</Form.Label>
          <InputGroup>
            <Form.Control className="custom-select" as="select" value={projectInfo.template} onChange={handleTemplate}>
              {TEMPLATE_LIST.map((temp, idx) => {
                return (
                  <option value={temp} key={idx}>
                    {temp}
                  </option>
                );
              })}
            </Form.Control>
            <Button variant="success" size="sm" onClick={wrappedCreateTemplate}>
              <small>Create</small>
            </Button>
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Text className="flex gap-1 text-muted">
            <Form.Label>Target Project</Form.Label>
            <span onClick={wrappedGetList}>
              <FaSyncAlt />
            </span>
          </Form.Text>
          <InputGroup>
            <Form.Control
              className="custom-select"
              as="select"
              value={projectInfo.compileTarget}
              onChange={handleTargetProject}
            >
              {projectInfo.projectList.map((projectName, idx) => {
                return (
                  <option value={projectName} key={idx}>
                    {projectName}
                  </option>
                );
              })}
            </Form.Control>
          </InputGroup>
        </Form.Group>
      </Form>
      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="uploadCodeCheckbox"
          checked={projectInfo.isUploadCode}
          onChange={handleUploadCode}
          // disabled={isCompiling || !!fileName}
        />
        <CustomTooltip
          placement="top"
          tooltipId="overlay-ataddresss"
          tooltipText="When you upload the code, a code verification feature will be provided in the future."
        >
          <label className="form-check-label" htmlFor="uploadCodeCheckbox" style={{ verticalAlign: "top" }}>
            Upload Code
          </label>
        </CustomTooltip>
      </div>
      <Button
        variant="primary"
        disabled={status.compile.loading}
        onClick={handleCompile}
        className="px-[1.25rem] py-[0.75rem] w-full flex justify-center items-center bg-metamask-active border-0 rounded-sm"
      >
        <FaSyncAlt className={`mr-2 ${status.compile.loading ? "animate-spin" : undefined}`} />
        <span>Compile</span>
      </Button>
      {projectInfo.fileName && <small>{projectInfo.fileName}</small>}
      {projectInfo.deploymentTx !== "" && (
        <Button
          variant="primary"
          disabled={status.deploy.loading}
          onClick={handleDeploy}
          className="px-[1.25rem] py-[0.75rem] w-full flex justify-center items-center bg-metamask-active border-0 rounded-sm"
        >
          <FaSyncAlt className={`mr-2 ${status.deploy.loading ? "animate-spin" : undefined}`} />
          <span>Deploy</span>
        </Button>
      )}
      {projectInfo.contractAddress && (
        <div>
          <small>Contract {projectInfo.contractAddress}</small>
        </div>
      )}
      {projectInfo.contractAddress !== "" && status.activate.ready && (
        <Button
          variant="primary"
          disabled={status.activate.loading || !info.account}
          onClick={handleActivate}
          className="px-[1.25rem] py-[0.75rem] w-full flex justify-center items-center bg-metamask-active border-0 rounded-sm"
        >
          <FaSyncAlt className={`mr-2 ${status.activate.loading ? "animate-spin" : undefined}`} />
          <span>Activate</span>
        </Button>
      )}
      <p className="text-center">
        <small>OR</small>
      </p>
      <InputGroup className="mb-3">
        <Form.Control
          value={projectInfo.atAddress}
          placeholder="contract address"
          onChange={handleAtAddress}
          size="sm"
          disabled={info.account === "" || status.compile.loading}
        />
        <OverlayTrigger
          placement="left"
          overlay={<Tooltip id="overlay-ataddresss">Use deployed Contract address</Tooltip>}
        >
          <Button
            variant="primary"
            size="sm"
            disabled={info.account === "" || status.compile.loading}
            onClick={async () => {
              sendCustomEvent("at_address", {
                event_category: "arbitrum",
                method: "at_address",
              });
              console.log(`@@@ contractAddr=${projectInfo.atAddress}`);
              setStatus((prev) => ({
                ...prev,
                atAddress: { ...initButtonStatus, loading: true },
              }));
              let abi = projectInfo.contractAbiMap.get(projectInfo.atAddress.toLowerCase());

              if (!abi) {
                const abiStr = await client.fileManager.readFile("browser/arbitrum/abi.json");
                abi = JSON.parse(abiStr);
              }

              setProjectInfo((prev) => ({
                ...prev,
                contractAddress: projectInfo.atAddress,
                contracts: prev.contracts.concat({ name: "", address: projectInfo.atAddress, abi: abi || [] }),
              }));
              setStatus((prev) => ({
                ...prev,
                atAddress: { ...initButtonStatus, loading: false },
              }));
            }}
          >
            <small>At Address</small>
          </Button>
        </OverlayTrigger>
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id="overlay-ataddresss">
              <span>Please specify ABI in </span>
              <span className="font-bold">/arbitrum/abi.json</span>
            </Tooltip>
          }
        >
          <div className="flex items-center bg-transparent border-0 text-white ml-1 font-size-0.9em cursor-pointer">
            &#9432;
          </div>
        </OverlayTrigger>
      </InputGroup>
      {projectInfo.contractAddress !== "" && projectInfo.contracts.length > 0 && (
        <>
          {projectInfo.contracts.map((item, index) => {
            console.log("projectInfo.contracts", item);
            return (
              <CSSTransition
                in={true}
                timeout={300}
                classNames="zoom"
                unmountOnExit
                onExited={() =>
                  setProjectInfo((prev) => {
                    const contracts = prev.contracts.filter((c) => c.address !== item.address);
                    return {
                      ...prev,
                      contracts,
                    };
                  })
                }
              >
                <Card className="mb-2">
                  <Card.Header className="px-2 py-1">
                    <strong className="align-middle">{item.name}</strong>
                    &nbsp;
                    <small className="align-middle">{`${item.address.substring(0, 6)}...${item.address.substring(
                      38
                    )}`}</small>
                    <Button
                      className="float-right align-middle"
                      size="sm"
                      variant="link"
                      onClick={() => {
                        const targetNetwork = ARBITRUM_NETWORK.find((n) => n.chainId === info.network);
                        if (!targetNetwork) return;
                        window.open(`${targetNetwork.blockExplorerUrls}/address/${item.address}`);
                      }}
                    >
                      <FaExternalLinkAlt />
                    </Button>
                    <Button
                      className="float-right align-middle"
                      size="sm"
                      variant="link"
                      onClick={() => {
                        setProjectInfo((prev) => {
                          const contracts = prev.contracts.filter((c) => c.address !== item.address);
                          return {
                            ...prev,
                            contracts,
                          };
                        });
                      }}
                    >
                      <FaTrashAlt />
                    </Button>
                  </Card.Header>
                  {item.abi.length > 0 && (
                    <>
                      {item.abi.map((abiItem, abiIndex) => {
                        if (isFunctionFragment(abiItem))
                          return (
                            <AccordionCard
                              web3={web3}
                              client={client}
                              key={`Methods_A_${abiIndex}`}
                              account={info.account}
                              address={item.address}
                              item={abiItem}
                              index={abiIndex}
                            />
                          );
                      })}
                    </>
                  )}
                </Card>
              </CSSTransition>
            );
          })}
        </>
      )}
      {projectInfo.contracts.length === 0 && (
        <Alert variant="warning" className="text-center" hidden={projectInfo.contracts.length !== 0}>
          <small>Currently you have no contract instances to interact with.</small>
        </Alert>
      )}
    </div>
  );
};

interface AccordionCardProps {
  account: string;
  client: Client<Api, Readonly<IRemixApi>>;
  item: AbiFunctionFragment;
  index: number;
  web3: Web3;
  address: string;
}
const AccordionCard = ({ account, item, index, client, web3, address }: AccordionCardProps) => {
  function CustomToggle({ children, eventKey }: any) {
    const decoratedOnClick = useAccordionButton(eventKey, () => {});

    return (
      <div className="card-header" style={{ padding: "5px", borderBottom: "0.1px" }} onClick={decoratedOnClick}>
        <small>{children}</small>
      </div>
    );
  }

  return (
    <Accordion key={`Methods_A_${index}`}>
      <Accordion.Item as={Card.Header} eventKey={`Methods_${index}`} style={{ padding: "0" }}>
        <CustomToggle eventKey={`Methods_${index}`}>{item.name}</CustomToggle>
        <Accordion.Collapse eventKey={`Methods_${index}`}>
          <Card.Body className="py-1 px-2">
            <DrawMethod account={account} abi={item} client={client} web3={web3} address={address} />
          </Card.Body>
        </Accordion.Collapse>
      </Accordion.Item>
    </Accordion>
  );
};

interface InterfaceDrawMethodProps {
  account: string;
  abi: AbiFunctionFragment;
  address: string;
  client: Client<Api, Readonly<IRemixApi>>;
  web3: Web3;
}

const DrawMethod: React.FunctionComponent<InterfaceDrawMethodProps> = (props) => {
  const { ethereum } = window;
  const [error, setError] = useState<string>("");
  // const [success, setSuccess] = useState<string>('');
  const [value, setValue] = useState<string>("");
  const [args, setArgs] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<{ [key: string]: string }>({});
  const { account, abi, address, client, web3 } = props;
  console.log(`@@@ DrawMethod address=${address}, abi=${JSON.stringify(abi)}`);
  useEffect(() => {
    const temp: { [key: string]: string } = {};
    abi.inputs?.forEach((element) => {
      temp[element.name] = "";
    });
    setArgs(temp);
  }, [abi.inputs]);

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

  function buttonVariant(stateMutability: string | undefined): string {
    switch (stateMutability) {
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
  }

  return (
    <>
      <Method
        abi={abi}
        setArgs={(name: string, value2: string) => {
          args[name] = value2;
        }}
      />
      <Alert variant="danger" hidden={error === ""}>
        <AlertCloseButton onClick={() => setError("")} />
        <small>{error}</small>
      </Alert>
      {/* <Alert variant="success" onClose={() => setSuccess('')} dismissible hidden={success === ''}>
        <small>{success}</small>
      </Alert> */}
      <br />
      <InputGroup className="mb-3">
        <Button
          variant={buttonVariant(abi.stateMutability)}
          size="sm"
          disabled={!ethereum || !ethereum.isMetaMask}
          onClick={async (event) => {
            if (!web3) {
              throw new Error("Web3 object is undefined");
            }
            // setBusy(true)
            setResult({});
            const parms: string[] = [];
            abi.inputs?.forEach((item) => {
              parms.push(args[item.name]);
            });
            const newContract = new web3.eth.Contract(JSON.parse(JSON.stringify([abi])), address);
            if (abi.stateMutability === "view" || abi.stateMutability === "pure") {
              try {
                const txReceipt: any = abi.name
                  ? await newContract.methods[abi.name](...parms).call({ from: account })
                  : null;

                if (Array.isArray(txReceipt) || typeof txReceipt !== "object") {
                  abi.outputs?.forEach((output, index) => {
                    const res = output.type + ": " + output.name + ": " + txReceipt;
                    result[index.toString()] = res;
                  });
                  setValue(txReceipt);
                } else {
                  abi.outputs?.forEach((output, index) => {
                    const res = output.type + ": " + output.name + ": " + txReceipt[index.toString()];
                    result[index.toString()] = res;
                  });

                  // setSuccess(JSON.stringify(txReceipt, null, 4));
                }
                // const html = (
                //   <CallResult result={result} from={address} to={abi.name === undefined ? "" : abi.name} hash="asdf" />
                // );
                console.log(result);
                const logString = CallResultAsString({
                  result,
                  from: address,
                  to: abi.name === undefined ? "" : abi.name,
                  hash: "asdf",
                });
                await client.call("terminal", "log", {
                  type: "html",
                  value: renderToString(logString),
                });
              } catch (e: any) {
                log.error(e);
                await client?.terminal.log({ type: "error", value: e?.message?.toString() });
                // setError(e.message ? e.message : e.toString());
              }
            } else {
              try {
                const hash = abi.name
                  ? await ethereum.request<string>({
                      method: "eth_sendTransaction",
                      params: [
                        {
                          from: account,
                          to: address,
                          data: newContract.methods[abi.name](...parms).encodeABI(),
                        },
                      ],
                    })
                  : null;
                if (!hash) {
                  throw new Error("Failed to get hash");
                }
                console.log(`@@@ call hash=${hash}`);

                const receipt = await getReceiptRecursively(hash);
                if (!receipt) {
                  throw new Error("Failed to get receipt");
                }

                const transaction = await web3.eth.getTransaction(hash);

                const logString = RenderTransactionsAsString({
                  status: receipt.status,
                  nonce: transaction.nonce,
                  from: transaction.from,
                  to:
                    transaction.to === null ? "Conract " + receipt.contractAddress + " Created" : transaction.to ?? "",
                  value: transaction.value,
                  logs: receipt.logs.toString(),
                  hash: transaction.hash,
                  gasUsed: receipt.gasUsed,
                });
                // const html = (
                //   <RenderTransactions
                //     status={(receipt as any).status}
                //     nonce={transaction.nonce}
                //     from={(receipt as any).from}
                //     to={
                //       (receipt as any).to === null
                //         ? "Conract " + (receipt as any).contractAddress + " Created"
                //         : (receipt as any).to
                //     }
                //     value={transaction.value}
                //     logs={(receipt as any).logs.toString()}
                //     hash={(receipt as any).transactionHash}
                //     gasUsed={(receipt as any).gasUsed}
                //   />
                // );
                // console.log(html, renderToString(html));
                await client.call("terminal", "log", { type: "html", value: logString });

                setError("");

                // setSuccess(JSON.stringify(receipt, null, 2));
              } catch (e: any) {
                log.error(e);
                await client?.terminal.log({ type: "error", value: e?.message?.toString() });
                // setError(e.message ? e.message : e.toString());
              }
            }
            // setBusy(false)
          }}
        >
          <small>{abi.stateMutability === "view" || abi.stateMutability === "pure" ? "call" : "transact"}</small>
        </Button>
        <Button
          variant={buttonVariant(abi.stateMutability)}
          size="sm"
          className="mt-0 pt-0 float-right"
          onClick={async () => {
            if (!web3) {
              throw new Error("Web3 object is undefined");
            }
            if (abi.name) {
              try {
                const parms: string[] = [];
                abi.inputs?.forEach((item) => {
                  if (args[item.name]) {
                    parms.push(args[item.name]);
                  }
                });
                const newContract = new web3.eth.Contract(JSON.parse(JSON.stringify([abi])), address);
                copy(newContract.methods[abi.name](...parms).encodeABI());
              } catch (e: any) {
                log.error(e);
                await client?.terminal.log({ type: "error", value: e?.message?.toString() });
              }
            }
          }}
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
    </>
  );
};

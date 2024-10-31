import JSZip from "jszip";
import axios from "axios";
import { type AbiItem, Web3 } from "web3";
import stripAnsi from "strip-ansi";
import BigNumber from "bignumber.js";
import { Button } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";
import { io, type Socket } from "socket.io-client";
import { type DisconnectDescription } from "socket.io-client/build/esm/socket";
import {
  compileIdV2,
  COMPILER_ARBITRUM_COMPILE_ERROR_OCCURRED_V1,
  COMPILER_ARBITRUM_COMPILE_LOGGED_V1,
  COMPILER_ARBITRUM_COMPILE_COMPLETED_V1,
  REMIX_ARBITRUM_COMPILE_REQUESTED_V1,
  type CompilerArbitrumCompileLoggedV1,
  type CompilerArbitrumCompileErrorOccurredV1,
  type CompilerArbitrumCompileCompletedV1,
  type RemixArbitrumCompileRequestedV1,
} from "wds-event";

import { LoaderWrapper } from "../common/loader";
import { useStore } from "../../zustand";
import { FileInfo, FileUtil } from "../../utils/file-utils";
import { log } from "../../utils/logger";
import { isEmptyList } from "../../utils/list-utils";
import { EditorClient } from "../../utils/editor";
import { CHAIN_NAME } from "../../const/chain";
import { COMPILER_WEBSOCKET_ENDPOINT, COMPILER_API_ENDPOINT } from "../../const/endpoint";
import { cleanupSocketArbitrum } from "../../utils/socket";
import { getPositionDetails, isRealError, stringify } from "../../const/helper";
import { S3Path } from "../../const/s3-path";
import { BUILD_FILE_TYPE } from "../../const/build-file-type";

const RCV_EVENT_LOG_PREFIX = `[==> EVENT_RCV]`;
const SEND_EVENT_LOG_PREFIX = `[EVENT_SEND ==>]`;

interface CompileProps {}
export const Compile = ({}: CompileProps) => {
  const {
    client,
    network,
    account,
    errorMsg,
    compileLoading,
    fileName,
    setLoading,
    resetCompile,
    setTimestamp,
    setFileName,
    setCompileErrorMsg,
    compilerVersion,
    os,
    project,
    upload,
    deployLoading,
    setDeployTransactionData,
    setDeployReady,
    resetDeploy,
    activateLoading,
    setActivateReady,
    resetActivate,
    setGasFee,
    setAddress,
  } = useStore(
    useShallow((state) => ({
      client: state.global.client,
      network: state.account.network.data,
      account: state.account.address.data,
      errorMsg: state.compile.errorMsg,
      compileLoading: state.compile.loading,
      fileName: state.compile.fileName,
      resetCompile: state.compile.reset,
      setLoading: state.compile.setLoading,
      setTimestamp: state.compile.setTimestamp,
      setFileName: state.compile.setFileName,
      setCompileErrorMsg: state.compile.setErrorMsg,
      compilerVersion: state.project.compilerVersion.data,
      os: state.project.os.data,
      project: state.project.project,
      upload: state.project.upload,
      setDeployTransactionData: state.deploy.setTransactionData,
      deployLoading: state.deploy.loading,
      setDeployReady: state.deploy.setReady,
      resetDeploy: state.deploy.reset,
      activateLoading: state.activate.loading,
      setActivateReady: state.activate.setReady,
      resetActivate: state.activate.reset,
      setGasFee: state.contract.setGasFee,
      setAddress: state.contract.setAddress,
    }))
  );
  // const [fileName, setFileName] = useState<string>("");
  const isLoading = compileLoading || deployLoading || activateLoading;

  const handleCompileOnClick = async () => {
    if (!client) return;
    if (isLoading) {
      client.terminal.log({ value: "Server is working...", type: "log" });
      return;
    }

    resetCompile();
    resetDeploy();
    resetActivate();
    setAddress(null);

    setLoading(true);
    log.info(`removeArtifacts ${"browser/" + (project.data ?? "") + "/output"}`);
    try {
      await client.fileManager.remove("browser/" + (project.data ?? "") + "/output");
    } catch (e) {
      log.info(`There is no output folder.`);
    }

    let projFiles = await FileUtil.allFilesForBrowser(client, project.data ?? "");
    log.info(`@@@ compile compileTarget=${project.data ?? ""}, projFiles=${JSON.stringify(projFiles, null, 2)}`);
    if (isEmptyList(projFiles)) {
      setLoading(false);
      return;
    }

    const rustToolchainFile = projFiles.find((f) => f.path === `${project.data ?? ""}/rust-toolchain.toml`);
    if (!rustToolchainFile) {
      client.terminal.log({
        type: "warn",
        value: `Not found "rust-toolchain.toml". Added default "rust-toolchain.toml".`,
      });
      const rustToolchainContent = `[toolchain]\nchannel = "1.80.0"`;
      await client.fileManager.writeFile(`browser/${project.data ?? ""}/rust-toolchain.toml`, rustToolchainContent);
      projFiles = await FileUtil.allFilesForBrowser(client, project.data ?? "");
      log.info(
        `@@@ compile compileTarget=${project.data ?? ""}, refresh projFiles=${JSON.stringify(projFiles, null, 2)}`
      );
    }

    const blob = await generateZip(projFiles);
    if (!blob) {
      setLoading(false);
      return;
    }

    await compile(blob, projFiles);
  };

  const generateZip = async (fileInfos: Array<FileInfo>) => {
    if (!client) return;
    const zip = new JSZip();

    await Promise.all(
      fileInfos.map(async (fileinfo: FileInfo) => {
        if (fileinfo.path.startsWith(`${project.data ?? ""}/artifacts`)) {
          return;
        }

        if (fileinfo.path.startsWith(`${project.data ?? ""}/schema`)) {
          return;
        }

        if (!fileinfo.isDirectory) {
          const content = await client.fileManager.readFile(fileinfo.path);
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
    if (!client) return;

    if (!account || !network) {
      setLoading(false);
      log.error(`There's no account or network while compiling.`);
      return;
    }
    const editorClient = new EditorClient(client);
    await editorClient.discardHighlight();
    await editorClient.clearAnnotations();

    const timestamp = Date.now().toString();
    setTimestamp(parseInt(timestamp));

    // ------------------------------------------------------------------
    try {
      const isSrcZipUploadSuccess = await FileUtil.uploadSrcZip({
        chainName: CHAIN_NAME.arbitrum,
        chainId: network,
        account: account,
        timestamp: timestamp.toString() || "0",
        fileType: "arbitrum",
        zipFile: blob,
        os,
      });
      if (!isSrcZipUploadSuccess) {
        setLoading(false);
        log.error(`src zip upload fail. address=${account}, timestamp=${timestamp}`);
        return;
      }
    } catch (e) {
      setLoading(false);
      log.error(`src zip upload fail. address=${account}, timestamp=${timestamp}`);
      client.terminal.log({ type: "error", value: `compile error occurred while uploading src zip` });
      return;
    }

    const projFiles_ = projFiles
      .filter((fileinfo) => {
        if (fileinfo.path === `${project.data ?? ""}/output` && fileinfo.isDirectory) {
          return false;
        }

        if (fileinfo.path.startsWith(`${project.data ?? ""}/output/`)) {
          return false;
        }

        return true;
      })
      .map((pf) => ({
        path: pf.path.replace((project.data ?? "") + "/", ""),
        isDirectory: pf.isDirectory,
      }));
    const uploadUrls = await FileUtil.uploadUrls({
      chainName: CHAIN_NAME.arbitrum,
      chainId: network,
      account: account,
      timestamp: timestamp.toString() || "0",
      projFiles: projFiles_,
      os,
    });

    if (uploadUrls.length === 0) {
      setLoading(false);
      log.error(`uploadUrls fail`);
      return;
    }

    console.log("COMPILER_WEBSOCKET_ENDPOINT(os)", COMPILER_WEBSOCKET_ENDPOINT(os));
    const socket = io(COMPILER_WEBSOCKET_ENDPOINT(os), {
      reconnection: false,
      transports: ["websocket"],
      timeout: 120_000,
    });

    try {
      socket.on("connect_error", function (err) {
        setLoading(false);
        log.debug("Error connecting to server");
        socket.disconnect();
      });

      socket.on("connect", async () => {});

      socket.on("disconnect", (reason: Socket.DisconnectReason, description?: DisconnectDescription) => {
        log.info("[SOCKET.ARBITRUM] disconnected.", reason, description);
        setLoading(false);
        log.info(`@@@ after disconnect. disconnected=${socket.disconnected}`);
        cleanupSocketArbitrum(socket);
      });

      socket.on("connect_error", async function (err) {
        // handle server error here
        log.info("[SOCKET.ARBITRUM] Error connecting to server");
        log.error(err);
        setLoading(false);
        log.info(`@@@ after connect_error. disconnected=${socket.disconnected}`);
        cleanupSocketArbitrum(socket);
        client.terminal.log({
          type: "error",
          value: `${err.message}`,
        });
      });

      socket.on(COMPILER_ARBITRUM_COMPILE_ERROR_OCCURRED_V1, async (data: CompilerArbitrumCompileErrorOccurredV1) => {
        if (!upload) {
          try {
            await axios.request({
              method: "DELETE",
              url: `${COMPILER_API_ENDPOINT(os)}/s3Proxy`,
              params: {
                chainName: CHAIN_NAME.arbitrum,
                chainId: network,
                account: account,
                timestamp: timestamp.toString() || "0",
              },
              responseType: "arraybuffer",
              responseEncoding: "null",
            });
          } catch (e) {}
        }

        log.info(`${RCV_EVENT_LOG_PREFIX} ${COMPILER_ARBITRUM_COMPILE_ERROR_OCCURRED_V1} data=${stringify(data)}`);
        if (data.compileId !== compileIdV2(CHAIN_NAME.arbitrum, network, account, timestamp)) {
          return;
        }
        client.terminal.log({ type: "error", value: data.errMsg.toString() });

        socket.disconnect();
        cleanupSocketArbitrum(socket);
      });

      socket.on(COMPILER_ARBITRUM_COMPILE_LOGGED_V1, async (data: CompilerArbitrumCompileLoggedV1) => {
        log.info(`${RCV_EVENT_LOG_PREFIX} ${COMPILER_ARBITRUM_COMPILE_LOGGED_V1} data=${stringify(data)}`);
        if (data.compileId !== compileIdV2(CHAIN_NAME.arbitrum, network, account, timestamp)) {
          return;
        }

        client.terminal.log({ type: "info", value: stripAnsi(data.logMsg) });

        if (data.logMsg.includes("error")) {
          const { file, annotation, positionDetail } = getPositionDetails(data.logMsg);

          if (file) {
            if (isRealError(annotation)) {
              await editorClient.addAnnotation(annotation);
              await editorClient.gotoLine(positionDetail.row, positionDetail.col);

              setCompileErrorMsg(`${errorMsg}\n${data.logMsg}`);
              setLoading(false);
              socket.disconnect();
              return;
            }
          }
        }

        const prefix = "wasm data fee: ";
        const suffix = " ETH";
        if (data.logMsg.includes(prefix)) {
          setActivateReady(true);
          const msg = stripAnsi(data.logMsg);
          const startIdx = msg.indexOf(prefix) + prefix.length;
          const endIdx = msg.indexOf(suffix);
          const dataFee = msg.slice(startIdx, endIdx);
          const web3 = new Web3();
          const wei = web3.utils.toWei(dataFee, "ether");
          const finalWei = new BigNumber(wei).multipliedBy(120).div(100).toNumber();
          const hex = web3.utils.toHex(finalWei);

          setGasFee(hex);
        }
      });

      socket.on(COMPILER_ARBITRUM_COMPILE_COMPLETED_V1, async (data: CompilerArbitrumCompileCompletedV1) => {
        socket.disconnect();

        log.info(`${RCV_EVENT_LOG_PREFIX} ${COMPILER_ARBITRUM_COMPILE_COMPLETED_V1} data=${stringify(data)}`);
        if (data.compileId !== compileIdV2(CHAIN_NAME.arbitrum, network, account, timestamp)) {
          return;
        }

        const res = await axios.request({
          method: "GET",
          url: `${COMPILER_API_ENDPOINT(os)}/s3Proxy`,
          params: {
            // bucket: S3Path.bucket(),
            bucket: "wds-code-build",
            fileKey: S3Path.outKey(CHAIN_NAME.arbitrum, network, account, timestamp, BUILD_FILE_TYPE.rs),
          },
          responseType: "arraybuffer",
          responseEncoding: "null",
        });

        if (!upload) {
          try {
            await axios.request({
              method: "DELETE",
              url: `${COMPILER_API_ENDPOINT(os)}/s3Proxy`,
              params: {
                chainName: CHAIN_NAME.arbitrum,
                chainId: network,
                account: account,
                timestamp: timestamp,
              },
              responseType: "arraybuffer",
              responseEncoding: "null",
            });
          } catch (e) {}
        }

        const zip = await new JSZip().loadAsync(res.data);

        try {
          await Promise.all(
            Object.keys(zip.files).map(async (filename) => {
              log.info(`arbitrum build result filename=${filename}`);
              if (filename.endsWith("output/deployment_tx_data.txt")) {
                const hex = await zip.files[filename].async("string");
                await client?.fileManager.writeFile("browser/" + (project.data ?? "") + "/" + filename, hex);
                // const fileData = await zip.files[filename].async("blob");
                // const hex = Buffer.from(await fileData.arrayBuffer()).toString("hex");
                // await client.fileManager.writeFile("browser/" + (project.data ?? "") + "/" + filename, hex);
                setFileName(filename);
                setDeployReady(true);
                setDeployTransactionData(`0x${hex}`);
              } else if (filename.endsWith("output/activation_tx_data.txt")) {
                const hex = await zip.files[filename].async("string");
                await client?.fileManager.writeFile("browser/" + (project.data ?? "") + "/" + filename, hex);
                // const fileData = await zip.files[filename].async("blob");
                // const hex = Buffer.from(await fileData.arrayBuffer()).toString("hex");
                // await client.fileManager.writeFile("browser/" + (project.data ?? "") + "/" + filename, hex);
              } else {
                const fileData = await zip.files[filename].async("string");
                if (filename === "output/abi.json") {
                  const abi = JSON.parse(fileData) as AbiItem[];
                  client.terminal.log({
                    type: "info",
                    value: `======================== ABI ========================`,
                  });
                  client.terminal.log({
                    type: "info",
                    value: `${JSON.stringify(abi, null, 2)}`,
                  });
                }

                await client.fileManager.writeFile("browser/" + (project.data ?? "") + "/" + filename, fileData);
              }
            })
          );

          const projFiles = await FileUtil.allFilesForBrowser(client, project.data ?? "");
          log.info(`@@@ compile compileTarget=${project.data ?? ""}, projFiles=${JSON.stringify(projFiles, null, 2)}`);
          client.terminal.log({
            type: "info",
            value: `\nBuild Completed.`,
          });
        } catch (e) {
          log.error(e);
        } finally {
          setLoading(false);
        }
      });

      // FIXME:
      const remixArbitrumCompileRequestedV1: RemixArbitrumCompileRequestedV1 & { cliVersion: string } = {
        compileId: compileIdV2(CHAIN_NAME.arbitrum, network, account, timestamp),
        chainName: CHAIN_NAME.arbitrum,
        chainId: network,
        address: account,
        timestamp: timestamp.toString() || "0",
        fileType: "arbitrum",
        cliVersion: compilerVersion,
      };

      socket.emit(REMIX_ARBITRUM_COMPILE_REQUESTED_V1, remixArbitrumCompileRequestedV1);
      log.info(
        `${SEND_EVENT_LOG_PREFIX} ${REMIX_ARBITRUM_COMPILE_REQUESTED_V1} data=${stringify(
          remixArbitrumCompileRequestedV1
        )}`
      );
    } catch (e) {
      setLoading(false);
      log.error(e);
      setCompileErrorMsg("Failed to compile. Please try again later.");
    }
  };

  return (
    <div>
      <Button
        variant="primary"
        disabled={isLoading}
        onClick={handleCompileOnClick}
        className="px-[1.25rem] py-[0.75rem] w-full relative flex justify-center items-center bg-metamask-active border-0 rounded-sm"
      >
        {/* <FaSyncAlt className={`mr-2 ${loading ? "animate-spin" : undefined}`} /> */}
        <span>Compile</span>
        <LoaderWrapper loading={isLoading} />
      </Button>
      {fileName && <small>{fileName}</small>}
    </div>
  );
};

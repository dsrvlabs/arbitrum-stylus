import { useEffect } from "react";
import axios from "axios";
import JSZip from "jszip";
import { FaSyncAlt, FaCheck } from "react-icons/fa";
import { FaExclamation } from "react-icons/fa6";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";

import { useStore } from "../../zustand";
import { log } from "../../utils/logger";
import { sendCustomEvent } from "../../utils/send-custom-event";
import { CustomTooltip } from "../common/custom-tooltip";
import { LoaderWrapper } from "../common/loader";
import { LoaderBouncingDot } from "../common/loader-bouncing-dot";
import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../../const/network";
import { isRPCError } from "../connect-metamask";
import { shortenAddress } from "../../utils/transaction";

interface ProjectProps {}
export const Project = ({}: ProjectProps) => {
  const { fetchProjects } = useStore(useShallow((state) => ({ fetchProjects: state.project.fetchProjects })));

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Form className="flex flex-col gap-2">
        <Network />
        <Os />
        <CompilerVersion />
        <Account />
        <Balance />
        <NewProject />
        <Template />
        <TargetProject />
      </Form>
      <UploadCode />
    </div>
  );
};

const Network = () => {
  const {
    provider,
    fetchNetwork,
    fetchAddress,
    fetchBalance,
    setErrorMsg,
    resetAccount,
    network,
    setNetwork,
    networks,
    compileLoading,
    resetCompile,
    deployLoading,
    resetDeploy,
    activateLoading,
    resetActivate,
    resetContract,
    resetVerify,
  } = useStore(
    useShallow((state) => ({
      provider: state.account.provider,
      fetchAddress: state.account.fetchAddress,
      fetchBalance: state.account.fetchBalance,
      fetchNetwork: state.account.fetchNetwork,
      setErrorMsg: state.account.setErrorMsg,
      resetAccount: state.account.reset,
      network: state.project.network.data,
      setNetwork: state.project.setNetwork,
      networks: state.project.networks.data,
      compileLoading: state.compile.loading,
      resetCompile: state.compile.reset,
      deployLoading: state.deploy.loading,
      resetDeploy: state.deploy.reset,
      activateLoading: state.activate.loading,
      resetActivate: state.activate.reset,
      resetContract: state.contract.reset,
      resetVerify: state.verify.reset,
    }))
  );
  const isLoading = compileLoading || deployLoading || activateLoading;

  const switchNetwork = async (chainId = ARBITRUM_ONE.chainId) => {
    if (!provider) return;
    const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === chainId);
    try {
      await provider.data?.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch (error) {
      let message: string | null = "Failed to switch network. Please try again.";
      if (isRPCError(error)) {
        message = error.message;
        if (error.message.includes("already pending")) message = null;
      }

      if (typeof error === "object" && error !== null && "code" in error) {
        if (error.code === 4902) {
          try {
            await provider.data?.request({ method: "wallet_addEthereumChain", params: [targetNetwork] });
            message = null;
            return;
          } catch (error) {
            message = "Failed to add network. Please try again.";
            if (isRPCError(error)) {
              message = error.message;
            }
          }
        }
      }
      setErrorMsg(message);
    } finally {
      await fetchNetwork();
      await fetchAddress();
      await fetchBalance();
    }
  };

  const handleNetworkOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const network = networks.find((item) => item.chainId === event.target.value);
    if (network) {
      resetAccount();
      resetCompile();
      resetDeploy();
      resetActivate();
      resetContract();
      resetVerify();
      setNetwork(network);
      switchNetwork(network.chainId);
    }
  };
  return (
    <Form.Group>
      <Form.Label>Network</Form.Label>
      <Form.Control
        as="select"
        className="disabled:!text-gray-400 disabled:cursor-not-allowed"
        value={network.chainId}
        disabled={isLoading}
        onChange={handleNetworkOnChange}
      >
        {networks.map((item) => (
          <option key={item.chainId} value={item.chainId}>
            {item.chainName}
          </option>
        ))}
      </Form.Control>
    </Form.Group>
  );
};

const Os = () => {
  const { os, oses, setOs, resetCompile, resetDeploy, resetActivate } = useStore(
    useShallow((state) => ({
      os: state.project.os.data,
      oses: state.project.oses.data,
      setOs: state.project.setOs,
      resetCompile: state.compile.reset,
      resetDeploy: state.deploy.reset,
      resetActivate: state.activate.reset,
    }))
  );

  const handleOsOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetCompile();
    resetDeploy();
    resetActivate();
    setOs(event.target.value);
  };

  return (
    <Form.Group>
      <Form.Label>Operating System</Form.Label>
      <Form.Control
        as="select"
        className="disabled:!text-gray-400 disabled:cursor-not-allowed"
        value={os}
        onChange={handleOsOnChange}
      >
        {oses &&
          oses.map((item, index) => {
            return (
              <option value={item} key={index}>
                {item}
              </option>
            );
          })}
      </Form.Control>
    </Form.Group>
  );
};

const CompilerVersion = () => {
  const { compilerVersion, setCompilerVersion, compilerVersions } = useStore(
    useShallow((state) => ({
      compilerVersion: state.project.compilerVersion.data,
      setCompilerVersion: state.project.setCompilerVersion,
      compilerVersions: state.project.compilerVersions.data,
    }))
  );

  const handleCompilerVersionOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCompilerVersion(event.target.value);
  };

  return (
    <Form.Group>
      <Form.Label>Compiler Version</Form.Label>
      <Form.Control
        as="select"
        className="disabled:!text-gray-400 disabled:cursor-not-allowed"
        value={compilerVersion}
        onChange={handleCompilerVersionOnChange}
      >
        {compilerVersions &&
          compilerVersions.map((item, index) => {
            return (
              <option value={item} key={index}>
                {item}
              </option>
            );
          })}
      </Form.Control>
    </Form.Group>
  );
};

const Account = () => {
  const { address } = useStore(useShallow((state) => ({ address: state.account.address.data })));
  return (
    <Form.Group>
      <Form.Label>Account</Form.Label>
      <Form.Control type="text" placeholder="Account" value={address ?? ""} readOnly />
    </Form.Group>
  );
};

const Balance = () => {
  const { balance } = useStore(useShallow((state) => ({ balance: state.account.balance.data })));
  return (
    <Form.Group>
      <Form.Label>Balance</Form.Label>
      <Form.Control type="text" placeholder="Account" value={balance ?? ""} readOnly />
    </Form.Group>
  );
};

const NewProject = () => {
  const { client, projects, fetchProjects, setProject, name, setName, compileLoading, deployLoading, activateLoading } =
    useStore(
      useShallow((state) => ({
        client: state.global.client,
        name: state.project.name.data,
        setName: state.project.setName,
        setProject: state.project.setProject,
        projects: state.project.projects.data,
        fetchProjects: state.project.fetchProjects,
        compileLoading: state.compile.loading,
        deployLoading: state.deploy.loading,
        activateLoading: state.activate.loading,
      }))
    );
  const isLoading = compileLoading || deployLoading || activateLoading;

  const isExists = async (dir: string) => {
    if (!client) return false;
    try {
      const result = await client.fileManager.readdir("browser/arbitrum/" + dir);
      if (Object.keys(result).length > 0 && result.constructor === Object) {
        return true;
      }
      return false;
    } catch (e) {
      log.error(e);
      return false;
    }
  };

  const createProject = async () => {
    if (!client || !name) return;
    sendCustomEvent("new_project", {
      event_category: "arbitrum",
      method: "new_project",
    });
    if (await isExists(name)) {
      await client.terminal.log({
        type: "error",
        value: 'The folder "arbitrum/' + name + '" already exists',
      });
      return;
    }

    try {
      const path = "browser/arbitrum/" + name;
      await client?.fileManager.mkdir(path + "/src");
      await client?.fileManager.mkdir(path + "/examples");
      await client?.fileManager.mkdir(path + "/.cargo/config");
      await client?.fileManager.writeFile(path + "/Cargo.toml", "");
      await fetchProjects();
      if (projects && projects.length > 0) setProject(projects[0]);
    } catch (e: any) {
      await client.terminal.log(e.message);
    }
  };

  const handleNameOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  return (
    <Form.Group>
      <Form.Label>Project</Form.Label>
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Project Name"
          value={name ?? ""}
          onChange={handleNameOnChange}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
        />
        <Button
          className="relative border-0"
          variant="secondary"
          size="sm"
          disabled={isLoading}
          onClick={createProject}
        >
          <small>Create</small>
          <LoaderWrapper loading={isLoading} />
        </Button>
      </InputGroup>
    </Form.Group>
  );
};

const Template = () => {
  const {
    client,
    template,
    setTemplate,
    templates,
    openzeppelinTemplates,
    fetchProjects,
    compileLoading,
    deployLoading,
    activateLoading,
  } = useStore(
    useShallow((state) => ({
      client: state.global.client,
      template: state.project.template.data,
      setTemplate: state.project.setTemplate,
      templates: state.project.templates.data,
      openzeppelinTemplates: state.project.openzeppelinTemplates.data,
      fetchProjects: state.project.fetchProjects,
      compileLoading: state.compile.loading,
      deployLoading: state.deploy.loading,
      activateLoading: state.activate.loading,
    }))
  );
  const isLoading = compileLoading || deployLoading || activateLoading;

  const createTemplate = async () => {
    if (!client || !template) return;
    sendCustomEvent("create_template", {
      event_category: "arbitrum",
      method: "create_template",
    });

    const isExists = async (dir: string) => {
      if (!client) return false;
      try {
        const result = await client.fileManager.readdir("browser/arbitrum/" + dir);
        if (Object.keys(result).length > 0 && result.constructor === Object) {
          return true;
        }
        return false;
      } catch (e) {
        log.error(e);
        return false;
      }
    };

    if (await isExists(template)) {
      await client.terminal.log({
        type: "error",
        value: `The folder ${template} already exists`,
      });
      return;
    }

    const res = await axios.request({
      method: "GET",
      url: `https://api.welldonestudio.io/compiler/s3Proxy?bucket=code-template&fileKey=arbitrum/` + template + ".zip",
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
        } else if (!key.startsWith("_") && key !== template + "/.DS_Store") {
          content = await zip.file(key)?.async("string");
          await client?.fileManager.writeFile("browser/arbitrum/" + key, content);
        }
      });
      await fetchProjects();

      await client.terminal.log({ type: "info", value: template + " is created successfully." });
    } catch (e) {
      log.error(e);
    }
  };

  const handleTemplateOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTemplate(event.target.value);
  };

  return (
    <Form.Group>
      <Form.Label>Select a Template</Form.Label>
      <InputGroup>
        <Form.Control className="custom-select" as="select" value={template ?? ""} onChange={handleTemplateOnChange}>
          <optgroup label="OpenZeppelin Templates">
            {openzeppelinTemplates &&
              openzeppelinTemplates.map((temp: string, idx: number) => {
                return (
                  <option value={temp} key={`oz-${idx}`}>
                    {temp}
                  </option>
                );
              })}
          </optgroup>
          <optgroup label="Basic Templates">
            {templates &&
              templates.map((temp, idx) => {
                return (
                  <option value={temp} key={idx}>
                    {temp}
                  </option>
                );
              })}
          </optgroup>
        </Form.Control>
        <Button
          className="relative border-0"
          variant="secondary"
          size="sm"
          disabled={isLoading}
          onClick={createTemplate}
        >
          <small>Create</small>
          <LoaderWrapper loading={isLoading} />
        </Button>
      </InputGroup>
    </Form.Group>
  );
};

const TargetProject = () => {
  const {
    fetchProjects,
    project,
    projects,
    setProject,
    resetCompile,
    resetDeploy,
    resetActivate,
    compileLoading,
    deployLoading,
    activateLoading,
    setAddress,
  } = useStore(
    useShallow((state) => ({
      fetchProjects: state.project.fetchProjects,
      projects: state.project.projects.data,
      project: state.project.project.data,
      setProject: state.project.setProject,
      resetCompile: state.compile.reset,
      resetDeploy: state.deploy.reset,
      resetActivate: state.activate.reset,
      compileLoading: state.compile.loading,
      deployLoading: state.deploy.loading,
      activateLoading: state.activate.loading,
      setAddress: state.contract.setAddress,
    }))
  );
  const isLoading = compileLoading || deployLoading || activateLoading;

  const handleTargetProjectOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProject(event.target.value);
  };

  useEffect(() => {
    resetCompile();
    resetDeploy();
    resetActivate();
    setAddress(null);
  }, [project]);

  return (
    <Form.Group>
      <Form.Text className="flex gap-1 text-muted">
        <Form.Label>Target Project</Form.Label>
        <span className="cursor-pointer" onClick={fetchProjects}>
          <FaSyncAlt />
        </span>
      </Form.Text>

      {projects ? (
        <Form.Control
          className="custom-select disabled:!text-gray-400 disabled:cursor-not-allowed"
          as="select"
          value={project ?? ""}
          disabled={isLoading || !projects}
          onChange={handleTargetProjectOnChange}
        >
          {projects &&
            (projects as string[]).map((item, index) => {
              return (
                <option value={item} key={index}>
                  {item}
                </option>
              );
            })}
        </Form.Control>
      ) : (
        <CustomTooltip
          placement="top"
          tooltipId="overlay-ataddresss"
          tooltipText={
            <p className="py-1 px-2">
              Please create a project first. <br />
              Click the "Create" button in the Project section.
            </p>
          }
          hoverable
        >
          <Form.Control
            className="custom-select disabled:!text-gray-400 disabled:cursor-not-allowed"
            as="select"
            value={project ?? ""}
            disabled={isLoading || !projects}
            onChange={handleTargetProjectOnChange}
          >
            {projects &&
              (projects as string[]).map((item, index) => {
                return (
                  <option value={item} key={index}>
                    {item}
                  </option>
                );
              })}
          </Form.Control>
        </CustomTooltip>
      )}
    </Form.Group>
  );
};

const UploadCode = () => {
  const { network, upload, setUpload, deployLoading, address, loading, verified, reset, contractAddress } = useStore(
    useShallow((state) => ({
      network: state.account.network.data,
      upload: state.project.upload.data,
      setUpload: state.project.setUpload,
      deployLoading: state.deploy.loading,
      address: state.verify.address,
      loading: state.verify.loading,
      verified: state.verify.verified,
      reset: state.verify.reset,
      contractAddress: state.contract.address,
    }))
  );
  const targetNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === network);
  const networkName = targetNetwork ? targetNetwork.network.split("_")[1].toLocaleLowerCase() : "";

  const handleUploadOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    reset();
    setUpload(event.target.checked);
  };

  const Icon = ({ verified }: { verified: boolean | null }) =>
    !address || verified === null ? (
      <div className="m-0 flex items-center">
        <input
          className="peer hidden"
          type="checkbox"
          id="uploadCodeCheckbox"
          disabled={deployLoading}
          checked={upload}
          onChange={handleUploadOnChange}
        />
        <label
          htmlFor="uploadCodeCheckbox"
          className={`
          m-0
          w-4 h-4
          border-[1px] border-gray-500 rounded-sm
          bg-gray-700
          peer-checked:bg-checked-circle
          peer-checked:bg-no-repeat
          peer-checked:bg-center
          `}
        />
      </div>
    ) : verified ? (
      <FaCheck className="text-success cursor-pointer" onClick={reset} />
    ) : (
      <FaExclamation className="text-warning cursor-pointer" onClick={reset} />
    );

  const Text = ({ verified }: { verified: boolean | null }) =>
    !address || verified === null ? (
      <p>Contract Verification</p>
    ) : verified ? (
      <p>
        [{" "}
        {shortenAddress({
          address,
        })}{" "}
        ] Verified. <br />
        For details, please visit{" "}
        <a
          className="font-bold hover:underline hover:text-white"
          target="blank"
          href={`https://verification-roan.vercel.app/verify?chain=arbitrum&network=${networkName}&contractAddress=${contractAddress}`}
        >
          VeriWell
        </a>
      </p>
    ) : (
      <p>
        {address
          ? `[ ${shortenAddress({
              address,
            })} ]`
          : ""}{" "}
        Verification failed. <br />
        Please try manually on{" "}
        <a
          className="font-bold hover:underline hover:text-white"
          target="blank"
          href="https://verification-roan.vercel.app"
        >
          VeriWell
        </a>
      </p>
    );

  return (
    <div className={`my-2 relative flex items-center gap-2`}>
      {loading ? <LoaderBouncingDot /> : <Icon verified={verified} />}

      <label className="form-check-label" htmlFor="uploadCodeCheckbox" style={{ verticalAlign: "top" }}>
        <p>{loading ? "Contract Verifying" : <Text verified={verified} />}</p>
      </label>
      <CustomTooltip
        placement="top"
        tooltipId="overlay-ataddresss"
        tooltipText={
          <p className="py-1 px-2">
            If you select this option, the code will be uploaded to{" "}
            <a
              className="font-bold hover:underline hover:text-white"
              target="blank"
              href="https://verification-roan.vercel.app"
            >
              VeriWell
            </a>{" "}
            and automatically verified after the deployment step
          </p>
        }
        hoverable
      >
        <div className="text-[#A2A3BD] font-size-0.9em cursor-pointer">&#9432;</div>
      </CustomTooltip>
    </div>
  );
};

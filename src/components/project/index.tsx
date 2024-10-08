import { useEffect } from "react";
import axios from "axios";
import JSZip from "jszip";
import { FaSyncAlt } from "react-icons/fa";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";

import { useStore } from "../../zustand";
import wrapPromise from "../../utils/wrap-promise";
import { log } from "../../utils/logger";
import { sendCustomEvent } from "../../utils/send-custom-event";
import { CustomTooltip } from "../common/custom-tooltip";
import { LoaderWrapper } from "../common/loader";
import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../../const/network";
import { isRPCError } from "../connect-metamask";

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
    console.log("network", network);
    if (network) {
      resetAccount();
      resetCompile();
      resetDeploy();
      resetActivate();
      resetContract();
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
        size="sm"
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

const Account = () => {
  const { address } = useStore(useShallow((state) => ({ address: state.account.address.data })));
  return (
    <Form.Group>
      <Form.Label>Account</Form.Label>
      <Form.Control type="text" placeholder="Account" value={address ?? ""} size="sm" readOnly />
    </Form.Group>
  );
};

const Balance = () => {
  const { balance } = useStore(useShallow((state) => ({ balance: state.account.balance.data })));
  return (
    <Form.Group>
      <Form.Label>Balance</Form.Label>
      <Form.Control type="text" placeholder="Account" value={balance ?? ""} size="sm" readOnly />
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
      log.debug(await client.fileManager.readdir("browser/arbitrum/" + dir));
      return true;
    } catch (e) {
      log.error(e);
      return false;
    }
  };

  const wrappedIsExists = (dir: string) => wrapPromise(isExists(dir), client);

  const createProject = async () => {
    if (!client || !name) return;
    sendCustomEvent("new_project", {
      event_category: "arbitrum",
      method: "new_project",
    });
    if (await wrappedIsExists(name)) {
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

  const wrappedCreateProject = () => wrapPromise(createProject(), client);

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
          size="sm"
          value={name ?? ""}
          onChange={handleNameOnChange}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
        />
        <Button
          className="relative border-0"
          variant="success"
          size="sm"
          disabled={isLoading}
          onClick={wrappedCreateProject}
        >
          <small>Create</small>
          <LoaderWrapper loading={isLoading} />
        </Button>
      </InputGroup>
    </Form.Group>
  );
};

const Template = () => {
  const { client, template, setTemplate, templates, fetchProjects, compileLoading, deployLoading, activateLoading } =
    useStore(
      useShallow((state) => ({
        client: state.global.client,
        template: state.project.template.data,
        setTemplate: state.project.setTemplate,
        templates: state.project.templates.data,
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

  const wrappedCreateTemplate = () => wrapPromise(createTemplate(), client);

  const handleTemplateOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTemplate(event.target.value);
  };

  return (
    <Form.Group>
      <Form.Label>Select a Template</Form.Label>
      <InputGroup>
        <Form.Control
          className="custom-select"
          as="select"
          size="sm"
          value={template ?? ""}
          onChange={handleTemplateOnChange}
        >
          {templates &&
            templates.map((temp, idx) => {
              return (
                <option value={temp} key={idx}>
                  {temp}
                </option>
              );
            })}
        </Form.Control>
        <Button
          className="relative border-0"
          variant="success"
          size="sm"
          disabled={isLoading}
          onClick={wrappedCreateTemplate}
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
    projects,
    project,
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

      <InputGroup>
        <Form.Control
          className="custom-select disabled:!text-gray-400 disabled:cursor-not-allowed"
          as="select"
          value={project ?? ""}
          disabled={isLoading}
          onChange={handleTargetProjectOnChange}
        >
          {projects &&
            projects.map((item, index) => {
              return (
                <option value={item} key={index}>
                  {item}
                </option>
              );
            })}
        </Form.Control>
      </InputGroup>
    </Form.Group>
  );
};

const UploadCode = () => {
  const { upload, setUpload } = useStore(
    useShallow((state) => ({ upload: state.project.upload.data, setUpload: state.project.setUpload }))
  );

  const handleUploadOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpload(event.target.checked);
  };

  return (
    <div className="form-check">
      <input
        type="checkbox"
        className="form-check-input"
        id="uploadCodeCheckbox"
        checked={upload}
        onChange={handleUploadOnChange}
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
  );
};

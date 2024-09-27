import axios from "axios";
import JSZip from "jszip";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";

import { useStore } from "../../zustand";
import wrapPromise from "../../utils/wrapPromise";
import { log } from "../../utils/logger";
import { sendCustomEvent } from "../../utils/sendCustomEvent";
import { FaSyncAlt } from "react-icons/fa";
import { useEffect } from "react";

interface ProjectProps {}
export const Project = ({}: ProjectProps) => {
  console.log("project rerender");
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
    </div>
  );
};

const Network = () => {
  console.log("project network rerender");
  const { project, account, network, networks } = useStore(
    useShallow((state) => ({
      project: state.project,
      account: state.account,
      network: state.project.network.data,
      networks: state.project.networks.data,
    }))
  );

  const handleNetworkOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const network = networks.find((item) => item.chainId === event.target.value);
    if (network) {
      project.setNetwork(network);
      account.reset();
    }
  };
  return (
    <Form.Group>
      <Form.Label>Network</Form.Label>
      <Form.Control as="select" value={network.chainId} size="sm" onChange={handleNetworkOnChange}>
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
  console.log("project account rerender");
  const { address } = useStore(useShallow((state) => ({ address: state.account.address.data })));
  return (
    <Form.Group>
      <Form.Label>Account</Form.Label>
      <Form.Control type="text" placeholder="Account" value={address ?? ""} size="sm" readOnly />
    </Form.Group>
  );
};

const Balance = () => {
  console.log("project balance rerender");
  const { balance } = useStore(useShallow((state) => ({ balance: state.account.balance.data })));
  return (
    <Form.Group>
      <Form.Label>Balance</Form.Label>
      <Form.Control type="text" placeholder="Account" value={balance ?? ""} size="sm" readOnly />
    </Form.Group>
  );
};

const NewProject = () => {
  console.log("project new project rerender");
  const { client, projects, fetchProjects, setProject, name, setName } = useStore(
    useShallow((state) => ({
      client: state.global.client,
      name: state.project.name.data,
      setName: state.project.setName,
      setProject: state.project.setProject,
      projects: state.project.projects.data,
      fetchProjects: state.project.fetchProjects,
    }))
  );

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
        <Button variant="success" size="sm" onClick={wrappedCreateProject}>
          <small>Create</small>
        </Button>
      </InputGroup>
    </Form.Group>
  );
};

const Template = () => {
  console.log("project template rerender");
  const { client, template, setTemplate, templates, fetchProjects, setProject } = useStore(
    useShallow((state) => ({
      client: state.global.client,
      template: state.project.template.data,
      setTemplate: state.project.setTemplate,
      templates: state.project.templates.data,
      fetchProjects: state.project.fetchProjects,
      setProject: state.project.setProject,
    }))
  );

  const createTemplate = async () => {
    if (!client || !template) return;
    sendCustomEvent("create_template", {
      event_category: "arbitrum",
      method: "create_template",
    });

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

    if (await wrappedIsExists(template)) {
      await client.terminal.log({
        type: "error",
        value: `The folder "arbitrum/${template} already exists`,
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
      setProject(template);

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
        <Form.Control className="custom-select" as="select" value={template ?? ""} onChange={handleTemplateOnChange}>
          {templates &&
            templates.map((temp, idx) => {
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
  );
};

const TargetProject = () => {
  console.log("project target project rerender");
  const { fetchProjects, projects, project, setProject } = useStore(
    useShallow((state) => ({
      fetchProjects: state.project.fetchProjects,
      projects: state.project.projects.data,
      project: state.project.project.data,
      setProject: state.project.setProject,
    }))
  );

  const handleTargetProjectOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProject(event.target.value);
  };

  return (
    <Form.Group>
      <Form.Text className="flex gap-1 text-muted">
        <Form.Label>Target Project</Form.Label>
        <span onClick={fetchProjects}>
          <FaSyncAlt />
        </span>
      </Form.Text>
      <InputGroup>
        <Form.Control
          className="custom-select"
          as="select"
          value={project ?? ""}
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

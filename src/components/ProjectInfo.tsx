import { type Dispatch, type SetStateAction, useState } from "react";
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import { InfoType, StatusType } from "./Main";
import wrapPromise from "../utils/wrapPromise";
import { sendCustomEvent } from "../utils/sendCustomEvent";
import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";
import { log } from "../utils/logger";

interface ProjectInfoProps {
  client: Client<Api, Readonly<IRemixApi>>;
  info: Exclude<InfoType, null>;
  status: StatusType;
  setInfo: Dispatch<SetStateAction<InfoType>>;
  setStatus: Dispatch<SetStateAction<StatusType>>;
}
export const ProjectInfo = ({ client, status, info, setInfo, setStatus }: ProjectInfoProps) => {
  const [project, setProject] = useState<string>("");
  const [projectList, setProjectList] = useState<string[]>([]);

  const handleNetwork = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === event.target.value);
    if (!targetNetwork) return;
    setInfo({ account: "", balance: "", network: targetNetwork.chainId });
    setStatus(null);
  };

  const handleProjectName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProject(event.target.value);
  };

  const getList = async () => {
    const projects = await getProjectHaveTomlFile("browser/arbitrum");
    setProjectList(projects);
    // if (projects?.length > 0) {
    //   const targetProjects = projects.find((item) => item.includes(template));
    //   const compileTarget = targetProjects ? targetProjects : projects[0];
    //   setCompileTarget(compileTarget);
    //   try {
    //     const abiStr = await client?.fileManager.readFile('browser/arbitrum/abi.json');
    //     setContractAbiMap((prevMap) => {
    //       const newMap = new Map(prevMap);
    //       return newMap;
    //     });
    //     console.log(`@@@ abiStr=${abiStr}`);
    //   } catch (e) {
    //     console.log(`No abi.json. Writing empty abi.`);
    //     await client?.fileManager.writeFile('browser/arbitrum/abi.json', '[]');
    //     setContractAbiMap((prevMap) => {
    //       const newMap = new Map(prevMap);
    //       return newMap;
    //     });
    //   }
    // }
  };

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
    if (await wrappedIsExists(project)) {
      await client.terminal.log({
        type: "error",
        value: 'The folder "arbitrum/' + project + '" already exists',
      });
      return;
    }

    try {
      const path = "browser/arbitrum/" + project;
      await client?.fileManager.mkdir(path + "/src");
      await client?.fileManager.mkdir(path + "/examples");
      await client?.fileManager.mkdir(path + "/.cargo/config");
      await client?.fileManager.writeFile(path + "/Cargo.toml", "");
      getList();
    } catch (e: any) {
      await client.terminal.log(e.message);
    }
  };

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

  return (
    <div className="mt-2">
      <Form>
        <Form.Group>
          <Form.Label>Network</Form.Label>
          <Form.Control as="select" value={ARBITRUM_ONE.chainId} onChange={handleNetwork} size="sm">
            {ARBITRUM_NETWORK.map((network, idx) => (
              <option key={idx} value={network.chainId}>
                {network.chainName}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group>
          <Form.Text className="text-muted">
            <small>ACCOUNT</small>
          </Form.Text>
          <InputGroup>
            <Form.Control type="text" placeholder="Account" value={info.account} size="sm" readOnly />
          </InputGroup>
          <Form.Text className="text-muted">
            <small>BALANCE</small>
          </Form.Text>
          <InputGroup>
            <Form.Control type="text" placeholder="Balance" value={info.balance} size="sm" readOnly />
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Text className="text-muted">
            <small>NEW PROJECT</small>
          </Form.Text>
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
            <Button variant="success" size="sm">
              <small>Create</small>
            </Button>
          </InputGroup>
        </Form.Group>
      </Form>
    </div>
  );
};

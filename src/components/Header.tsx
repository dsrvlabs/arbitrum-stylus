import { Badge } from "react-bootstrap";
import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";
import { EditorClient } from "../utils/editor";
import RefreshButton from "./RefreshButton";
import { useStore } from "../zustand";
import { useShallow } from "zustand/react/shallow";

interface HeaderProps {}
export const Header = ({}: HeaderProps) => {
  const { client } = useStore(useShallow((state) => ({ client: state.global.client })));
  const handleRefresh = async () => {
    if (!client) return;
    const editorClient = new EditorClient(client);
    await editorClient.discardHighlight();
    await editorClient.clearAnnotations();
    window.location.reload();
  };

  return (
    <div className="mt-3 flex justify-between items-end sticky top-0">
      <p>Arbitrum</p>
      <div className="flex align-items-center">
        <a
          href="https://docs.welldonestudio.io/code/deploy-and-run/arbitrum"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          <Badge pill bg="primary" style={{ color: "white", marginRight: "10px" }}>
            {"docs"}
          </Badge>
        </a>
        <a
          href="https://support.welldonestudio.io/"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          <Badge pill bg="danger" className="me-2" style={{ color: "white", marginRight: "10px" }}>
            {"issues"}
          </Badge>
        </a>
        <RefreshButton handleRefresh={handleRefresh} />
      </div>
    </div>
  );
};

import { Button } from "react-bootstrap";
import Github from "../assets/github-mark-light-64px.png";

export const MakeAIssueButton: React.FunctionComponent = () => {
  return (
    <Button
      className="w-full flex justify-center items-center"
      onClick={() => {
        window.open("https://github.com/dsrvlabs/wds-code-remix/issues");
      }}
    >
      <img src={Github} style={{ width: "35px", marginRight: "20px" }} alt="Github logo" />
      <b>Make an issue</b>
    </Button>
  );
};

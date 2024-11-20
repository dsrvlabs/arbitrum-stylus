import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { createClient } from "@remixproject/plugin-iframe";

import { log } from "./utils/logger";
import { Main } from "./components/main";
import { useStore } from "./zustand";
import { useShallow } from "zustand/react/shallow";

export const App: React.FunctionComponent = () => {
  const { global } = useStore(useShallow((state) => ({ global: state.global })));
  const [connection, setConnection] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      const temp = createClient();
      await temp.onload();

      global.setClient(temp);
      setConnection(true);
    };
    if (!connection) init();
    log.debug(`%cẅël̈l̈c̈öm̈ë-̈ẗö-̈ẅël̈l̈d̈ön̈ë-̈c̈öd̈ë!̈`, "color:yellow");
  }, []);

  console.info("version 0.2.3");

  return (
    <div className="App">
      <Container>{global.client && <Main />}</Container>
    </div>
  );
};

export default App;

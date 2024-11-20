type Stage = "local" | "dev" | "prod";

export const LOCAL: Stage = "local";
export const DEVELOP: Stage = "dev";
export const PROD: Stage = "prod";

// let stage = process.env.REACT_APP_STAGE;
let stage = "prod";
if (stage === PROD) {
  stage = PROD;
} else if (stage === DEVELOP) {
  stage = DEVELOP;
} else {
  stage = LOCAL;
}

export const STAGE: Stage = stage as Stage;

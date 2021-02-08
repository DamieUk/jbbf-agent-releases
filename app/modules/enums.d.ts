declare module 'os-enums' {
  export type OS_TYPE = 'WINDOWS' | 'LINUX' | 'MAC';
}

declare module 'env-enums' {
  export interface IDynamicEnvVars {
    AGENT_TOKEN: string | null;
    API_SERVER_URL: string | null;
    SCRIPT_SERVER_URL: string | null;
    SOCKET_SERVER_URL: string | null;
    VM_ID: string | null;
  }

  interface IAppEnvironments extends IDynamicEnvVars {
    HOME: string;
    APP_NAME: string;
    PROJECT_PATH: string;
    LOGS: {
      MAC: string;
      WINDOWS: string;
      LINUX: string;
    },
    AUTH_KEYS_PATH: {
      ROOT: string;
      CERT: string;
      PFX: string;
      PRIVATE: string;
    };
    VM_TOOLS_UTILS: string;
    ENV_FILE_PATH: string;
    SESSION_PATH: string;
    SCRIPTS_EXE_FOLDER: string;
  }
}

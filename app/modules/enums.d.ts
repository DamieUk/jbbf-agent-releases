declare module 'os-enums' {
  export type OS_TYPE = 'WINDOWS' | 'LINUX' | 'MAC';
}

declare module 'env-enums' {
  export type ENV_TYPES = 'prod' | 'dev' | 'test' | 'stage' | 'local';

  export interface IDynamicEnvVars {
    AGENT_TOKEN: string | null;
    API_SERVER_URL: string | null;
    SCRIPT_SERVER_URL: string | null;
    SOCKET_SERVER_URL: string | null;
    FILE_STORAGE_SERVER_URL: string | null;
    ENV: ENV_TYPES | null;
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
    REBOOT_SCRIPTS_PATH: string;
    SESSION_PATH: string;
    SCRIPTS_EXE_FOLDER: string;
  }
}

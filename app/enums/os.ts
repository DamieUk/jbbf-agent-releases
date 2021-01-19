import os from "os";

const platformsNames: any = {
  win32: 'WINDOWS',
  darwin: 'MAC',
  linux: 'LINUX',
};

export const CurrentOS = platformsNames[os.platform()];

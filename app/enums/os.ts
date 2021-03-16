import os from "os";
import { IPlatform } from "os-types";

const platformsNames: { [field: string] : IPlatform} = {
  win32: 'WINDOWS',
  darwin: 'MAC',
  linux: 'LINUX',
};

export const CurrentOS: IPlatform = platformsNames[os.platform()];


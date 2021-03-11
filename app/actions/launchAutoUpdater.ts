// @ts-ignore
import AutoUpdater from 'auto-updater';
import {IAnyFunc} from "global-shapes";

const initUpdater = (): IAnyFunc => {
  const autoupdater = new AutoUpdater({
    pathToJson: '',
    autoupdate: true,
    checkgit: true,
    contenthost: 'https://github.com',
    progressDebounce: 0,
    devmode: process.env.NODE_ENV === 'development'
  });

  autoupdater.on('git-clone', () => {
    console.log("You have a clone of the repository. Use 'git pull' to be up-to-date");
  });

  autoupdater.on('check.up-to-date', (v: string) => {
    console.info("You have the latest version: " + v);
  });

  autoupdater.on('check.out-dated', (v_old: string, v : string) => {
    console.warn("Your version is outdated. " + v_old + " of " + v);
    autoupdater.fire('download-update'); // If autoupdate: false, you'll have to do this manually.
    // Maybe ask if the'd like to download the update.
  });

  autoupdater.on('update.downloaded', () => {
    console.log("Update downloaded and ready for install");
    autoupdater.fire('extract'); // If autoupdate: false, you'll have to do this manually.
  });

  autoupdater.on('update.not-installed', () => {
    console.log("The Update was already in your folder! It's read for install");
    autoupdater.fire('extract'); // If autoupdate: false, you'll have to do this manually.
  });

  autoupdater.on('update.extracted', () => {
    console.log("Update extracted successfully!");
    console.warn("RESTART THE APP!");
  });

  autoupdater.on('download.start', (name: string) => {
    console.log("Starting downloading: " + name);
  });

  autoupdater.on('download.progress', (name: string, perc: string) => {
    process.stdout.write(name + " - Downloading " + perc + "% \033[0G");
  });

  autoupdater.on('download.end', (name: string) => {
    console.log("Downloaded " + name);
  });

  autoupdater.on('download.error', (err: any) => {
    console.error("Error when downloading: " + err);
  });

  autoupdater.on('end', () => {
    console.log("The app is ready to");
  });

  autoupdater.on('error', (name: string, e: any) => {
    console.error(name, e);
  });

  return (): IAnyFunc => {
    // Start checking
    const timer = setInterval(() => autoupdater.fire('check'), 30 * 10000) // 30 sec
    return () => clearInterval(timer);
  }
}

export default initUpdater();


import path from 'path';
import fs from 'fs';
import {generateKeyPair} from 'crypto';
import {AgentSession} from './session';
import logger from './logger';
import { writeFile } from './files';
import {exec} from "child_process";
import {execute} from "./execute";

interface IResponse {
  keysDirPath: string;
  publicKeyPath: string;
  privateKeyPath: string;
}

export default function generateKeys(projectPath: string, vmId: string | null): any {
  const keysDirPath = path.resolve(projectPath, 'publicKeys');
  const publicKeyPath = path.resolve(keysDirPath, 'id_rsa.pub');
  const privateKeyPath = path.resolve(keysDirPath, 'id_rsa');
  const createCertificateCommand = `New-SelfSignedCertificate -DnsName "vm${vmId}" -CertStoreLocation "${path.resolve('cert:', 'LocalMachine', 'My')}" -KeyUsage KeyEncipherment,DataEncipherment, KeyAgreement -Type DocumentEncryptionCert`;
  if (vmId) {
    return execute(createCertificateCommand).catch(() => logger.error('Could not create certificate. Maybe it is already exist'));
  }
}

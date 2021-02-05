import path from 'path';
import fs from 'fs';
import forge from 'node-forge';
import {generateKeyPair} from 'crypto';
import {AgentSession} from './session';
import { PROGRAM_DATA_PATH, PROJECT_KEYS_PATH } from '../enums';
import logger from './logger';
import { writeFile } from './files';
import os from 'os';
// @ts-ignore
import ckWin32 from '@chilkat/ck-node14-win-ia32';
// @ts-ignore
import ckWin64 from '@chilkat/ck-node14-win64';
// @ts-ignore
import ckLinux from '@chilkat/ck-node14-arm';
// @ts-ignore
import ckLinux64 from '@chilkat/ck-node14-linux64';
// @ts-ignore
import ckMac from '@chilkat/ck-node14-macosx';

interface IResponse {
  keysDirPath: string;
  pfxKeyPath: string;
  certificatePath: string;
  privateKeyPath: string;
}

let chilkat = ckWin64;

if (os.platform() == 'win32') {
  if (os.arch() == 'ia32') {
    chilkat = ckWin32;
  } else {
    chilkat = ckWin64;
  }
} else if (os.platform() == 'linux') {
  if (os.arch() == 'arm') {
    chilkat = ckLinux;
  } else {
    chilkat = ckLinux64;
  }
} else if (os.platform() == 'darwin') {
  chilkat = ckMac;
}

function savePfxFile(certPemFilePath: string, privateKeyPemFilePath: string, pfxPath: string) {

  // First load our certificate into a certificate object,
  // and then get it as a cert chain object.
  const cert = new chilkat.Cert();

  let success = cert.LoadFromFile(certPemFilePath);
  if (success !== true) {
    logger.log('Chilkat certificate loading error ->>> ', cert.LastErrorText);
    return;
  }

  // Get it as a certificate chain.
  // certChain: CertChain
  const certChain = cert.GetCertChain();
  if (cert.LastMethodSuccess !== true) {
    logger.log('Chilkat certificate error ->>> ', cert.LastErrorText);
    return;
  }

  // Next, load the corresponding private key from a PEM.
  const privKey = new chilkat.PrivateKey();
  success = privKey.LoadPemFile(privateKeyPemFilePath);
  if (success !== true) {
    logger.log('Chilkat private key load error ->>> ', privKey.LastErrorText);

    return;
  }

  // Create a PFX object instance, and add the private key + cert chain.
  const pfx = new chilkat.Pfx();
  success = pfx.AddPrivateKey(privKey, certChain);
  if (success !== true) {
    logger.log('Chilkat certificate file creation error ->>> ', pfx.LastErrorText);

    return;
  }

  success = pfx.ToFile(undefined, pfxPath);
  if (success !== true) {
    logger.log(pfx.LastErrorText);
    return;
  }

  console.log("Successfully created pfx key.");
}


export default function generateKeys(): Promise<IResponse> {
  const keysDirPath = PROJECT_KEYS_PATH;
  const certificatePath = path.resolve(keysDirPath, 'certificate.pem');
  const pfxKeyPath = path.resolve(keysDirPath, 'sharedKey.pfx');
  const privateKeyPath = path.resolve(keysDirPath, 'id_rsa');

  return new Promise((resolve, reject) => {
    fs.access(pfxKeyPath, undefined, async (err) => {
      if (!err) {
        logger.info('App already has public keys');
        resolve({
          keysDirPath,
          pfxKeyPath,
          privateKeyPath,
          certificatePath,
        });
      } else {
        fs.mkdirSync(keysDirPath);

        const { pki } = forge;

        // generate a keypair or use one you have already
        const keys = pki.rsa.generateKeyPair(2048);

        // create a new certificate
        const cert = pki.createCertificate();

        // fill the required fields
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

        const attrs: any[] = [];

        // here we set subject and issuer as the same one
        cert.setSubject(attrs);
        cert.setIssuer(attrs);


        cert.setExtensions([{
          name: 'basicConstraints',
          cA: true
        }, {
          name: 'keyUsage',
          keyCertSign: true,
          digitalSignature: true,
          nonRepudiation: true,
          keyEncipherment: true,
          dataEncipherment: true
        }, {
          name: 'extendedKeyUsage',
          id: '1.3.6.1.4.1.311.90.1'
        }]);

        // the actual certificate signing
        cert.sign(keys.privateKey);
        logger.log('Certificate created.');

        const pems = {
          cert: pki.certificateToPem(cert),
          privateKey: pki.privateKeyToPem(keys.privateKey),
        }

        await writeFile(privateKeyPath, pems.privateKey)
          .catch(err => logger.error(`Error while creating private key file --->>> `, err));

        await writeFile(pfxKeyPath, pems.cert)
          .catch(err => logger.error(`Error while creating pfx key file --->>> `, err));

        AgentSession.setEnvs({
          privateKey: pems.privateKey
            .replace('-----BEGIN RSA PRIVATE KEY-----', '')
            .replace('-----END RSA PRIVATE KEY-----', '')
            .replace('\n', '')
        });

        savePfxFile(pems.cert, privateKeyPath)

        resolve({
          keysDirPath,
          pfxKeyPath,
          privateKeyPath
        })
      }
    })
  })
}

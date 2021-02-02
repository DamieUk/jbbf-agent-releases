import path from 'path';
import fs from 'fs';
import {generateKeyPair} from 'crypto';
import {AgentSession} from './session';
import logger from './logger';
import { writeFile } from './files';

interface IResponse {
  keysDirPath: string;
  publicKeyPath: string;
  privateKeyPath: string;
}

export default function generateKeys(projectPath: string): Promise<IResponse> {
  const keysDirPath = path.resolve(projectPath, 'publicKeys');
  const publicKeyPath = path.resolve(keysDirPath, 'id_rsa.pub');
  const privateKeyPath = path.resolve(keysDirPath, 'id_rsa');

  return new Promise((resolve, reject) => {
    fs.access(publicKeyPath, undefined, async (err) => {
      if (!err) {
        logger.info('App already has public keys');
        resolve({
          keysDirPath,
          publicKeyPath,
          privateKeyPath
        });
      } else {
        fs.mkdirSync(keysDirPath);
        generateKeyPair(
          "rsa",
          {
            modulusLength: 2048,
            publicKeyEncoding: {
              type: "pkcs1",
              format: "pem",
            },
            privateKeyEncoding: {
              type: "pkcs1",
              format: "pem",
            },
          },
          async (_err, publicKey, privateKey) => {

            if (_err) {
              reject(_err);
              logger.error("Error!", err);
            }

            await writeFile(privateKeyPath, privateKey)
              .catch(err => logger.error(`Error while creating private key file --->>> `, err));

            await writeFile(publicKeyPath, publicKey)
              .catch(err => logger.error(`Error while creating public key file --->>> `, err));

            AgentSession.setEnvs({
              publicKey: publicKey
                .replace('-----BEGIN RSA PUBLIC KEY-----', '')
                .replace('-----END RSA PUBLIC KEY-----', '')
                .replace('\n', '')
            })

            AgentSession.setEnvs({
              privateKey: privateKey
                .replace('-----BEGIN RSA PRIVATE KEY-----', '')
                .replace('-----END RSA PRIVATE KEY-----', '')
                .replace('\n', '')
            })

            resolve({
              keysDirPath,
              publicKeyPath,
              privateKeyPath
            })
          }
        );
      }
    })
  })
}

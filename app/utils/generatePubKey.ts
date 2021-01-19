import fs from 'fs';
import {generateKeyPair, verify, constants, sign} from 'crypto';
import {AgentSession} from './session';
import logger from './logger';
import { writeFile } from './files';

interface IResponse {
  keysDirPath: string;
  publicKeyPath: string;
  privateKeyPath: string;
}

export default function generateKeys(projectPath: string): Promise<IResponse> {
  const keysDirPath = `${projectPath}/publicKeys`;
  const publicKeyPath = `${keysDirPath}/id_rsa.pub`;
  const privateKeyPath = `${keysDirPath}/id_rsa`;

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
            modulusLength: 2048, // It holds a number. It is the key size in bits and is applicable for RSA, and DSA algorithm only.
            publicKeyEncoding: {
              type: "pkcs1", //Note the type is pkcs1 not spki
              format: "pem",
            },
            privateKeyEncoding: {
              type: "pkcs1", //Note again the type is set to pkcs1
              format: "pem",
              // cipher: "aes-256-cbc", //Optional
              // passphrase: "", //Optional
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

            const verifiableData = "this need to be verified";


            const signature = sign("sha256", Buffer.from(verifiableData),
              {
                key: privateKey,
                padding: require("crypto").constants.RSA_PKCS1_PSS_PADDING,
              });


            const isVerified = verify(
              "sha256",
              Buffer.from(verifiableData),
              {
                key: publicKey,
                padding: constants.RSA_PKCS1_PSS_PADDING,
              },
              Buffer.from(signature.toString("base64"), "base64")
            );

            // isVerified should be `true` if the signature is valid
            logger.info("public signature is verified ->>> ", isVerified);

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

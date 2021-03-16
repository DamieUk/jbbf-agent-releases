import path from 'path';
import fs from 'fs';
// @ts-ignore
import forge from 'node-forge';
import { AgentSession } from './session';
import { PROJECT_KEYS_PATH } from '../enums';
import logger from './logger';
import { isFileExist, mkDir, writeFile } from './files';

interface IResponse {
  keysDirPath: string;
  pfxKeyPath: string;
  certificatePath: string;
  privateKeyPath: string;
}

export default function generateKeys(
  vmId: string | number
): Promise<IResponse> {
  const certificatePath = path.resolve(PROJECT_KEYS_PATH, 'certificate.cert');
  const pfxKeyPath = path.resolve(PROJECT_KEYS_PATH, 'certContainer.p12');
  const privateKeyPath = path.resolve(PROJECT_KEYS_PATH, 'privateKey.key');

  return new Promise((resolve, reject) => {
    fs.access(pfxKeyPath, undefined, async (err) => {
      if (!err) {
        logger.info('App already has public keys');
        resolve({
          keysDirPath: PROJECT_KEYS_PATH,
          pfxKeyPath,
          privateKeyPath,
          certificatePath,
        });
      } else {
        await mkDir(PROJECT_KEYS_PATH);
        if (vmId) {
          try {
            const { pki, md, pkcs12, asn1 } = forge;

            // generate a keypair or use one you have already
            const keys = pki.rsa.generateKeyPair(2048);

            // create a new certificate
            const cert = pki.createCertificate();

            // fill the required fields
            cert.publicKey = keys.publicKey;
            cert.serialNumber = '01';
            cert.validity.notBefore = new Date();
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(
              cert.validity.notBefore.getFullYear() + 20
            );

            const attrs: any[] = [
              {
                name: 'commonName',
                value: `jbbf-mv${vmId}-certificate`,
              },
            ];

            // here we set subject and issuer as the same one
            cert.setSubject(attrs);
            cert.setIssuer(attrs);

            cert.setExtensions([
              {
                name: 'basicConstraints',
                cA: false,
              },
              {
                name: 'keyUsage',
                keyAgreement: '38',
                keyEncipherment: true,
                dataEncipherment: true,
              },
              {
                // extendedKeyUsage extension
                id: '2.5.29.37', // OID for extendedKeyUsage
                // the extension value appears to be an ASN.1 sequence of OIDs
                // and the OID for 'documentEncryption' is '1.3.6.1.4.1.311.80.1'
                value: asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.SEQUENCE,
                  true,
                  [
                    asn1.create(
                      asn1.Class.UNIVERSAL,
                      asn1.Type.OID,
                      false,
                      asn1.oidToDer('1.3.6.1.4.1.311.80.1').getBytes()
                    ),
                  ]
                ),
              },
            ]);

            // the actual certificate signing
            cert.sign(keys.privateKey, md.sha256.create());

            logger.info('Certificate created.');

            const pems = {
              cert: pki.certificateToPem(cert),
              privateKey: pki.privateKeyToPem(keys.privateKey),
            };

            await isFileExist(privateKeyPath).catch(() =>
              writeFile(privateKeyPath, pems.privateKey).catch((err) =>
                logger.error(
                  `Error while creating private key file --->>> `,
                  err
                )
              )
            );

            await isFileExist(certificatePath).catch(() =>
              writeFile(certificatePath, pems.cert).catch((err) =>
                logger.error(
                  `Error while creating certificate key file --->>> `,
                  err
                )
              )
            );

            AgentSession.setEnvs({
              privateKey: pems.privateKey,
              certificate: pems.cert,
            });

            const p12Asn1 = pkcs12.toPkcs12Asn1(keys.privateKey, cert, '', {
              algorithm: '3des',
            });

            const p12Der = asn1.toDer(p12Asn1).getBytes();

            await isFileExist(pfxKeyPath).catch(() =>
              writeFile(pfxKeyPath, p12Der, {
                encoding: 'binary',
              }).catch((err) =>
                logger.error(`Error while creating p12 file --->>> `, err)
              )
            );
          } catch (e) {
            reject(
              `Error while generating private and certificate: ${e.toString()}`
            );
          }
        } else {
          reject('Vm id is not found.');
        }

        resolve({
          keysDirPath: PROJECT_KEYS_PATH,
          pfxKeyPath,
          certificatePath,
          privateKeyPath,
        });
      }
    });
  });
}

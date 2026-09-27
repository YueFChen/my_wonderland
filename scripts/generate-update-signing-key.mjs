#!/usr/bin/env node

import { generateKeyPairSync } from 'node:crypto'

const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const publicDer = publicKey.export({ format: 'der', type: 'spki' })
const privateDer = privateKey.export({ format: 'der', type: 'pkcs8' })

console.log(JSON.stringify({
  publicKeyHex: publicDer.subarray(-32).toString('hex'),
  privateSeedBase64: privateDer.subarray(-32).toString('base64'),
}, null, 2))

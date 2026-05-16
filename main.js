import * as StellarSdk
from "https://esm.sh/@stellar/stellar-sdk"

import {
  isConnected,
  requestAccess,
  getAddress,
  signTransaction
}
from "https://esm.sh/@stellar/freighter-api"

const server =
  new StellarSdk.Horizon.Server(
    "https://horizon-testnet.stellar.org"
  )

let publicKey = ""

const localHashes = {}

/*
  SHA-256
*/

async function generateSHA256(payload){

  const encoder =
    new TextEncoder()

  const data =
    encoder.encode(payload)

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    )

  const hashArray =
    Array.from(
      new Uint8Array(hashBuffer)
    )

  return hashArray
    .map(
      b =>
        b.toString(16)
         .padStart(2,"0")
    )
    .join("")
}

/*
  CONNECT
*/

async function connectWallet(){

  try{

    const connected =
      await isConnected()

    if(
      !connected.isConnected
    ){

      alert(
        "Freighter não encontrada"
      )

      return
    }

    await requestAccess()

    const addressObj =
      await getAddress()

publicKey =
  addressObj.address

/*
  TESTE REAL
*/

const account =
  await server.loadAccount(
    publicKey
  )

console.log(
  "ACCOUNT",
  account
)

document.getElementById(
  "walletAddress"
).innerText =
  publicKey

alert(
  "Wallet REAL conectada!"
)

  } catch(err){

    console.error(err)

    alert(err.message)
  }
}

/*
  ANCHOR
*/

async function anchorHash(){

  try{

    if(!publicKey){

      alert(
        "Conecte a wallet"
      )

      return
    }

    const matricula =
      document.getElementById(
        "matricula"
      ).value

    const valor =
      document.getElementById(
        "valor"
      ).value

    const payload =
      JSON.stringify({

        matricula,

        valor,

        timestamp:
          new Date()
            .toISOString()

      })

    /*
      SHA-256
    */

    const hashHex =
      await generateSHA256(
        payload
      )

    localHashes[matricula] = {

      payload,

      hash: hashHex

    }

    /*
      ACCOUNT
    */

    const account =
      await server.loadAccount(
        publicKey
      )

    /*
      TX
    */

    const tx =
      new StellarSdk.TransactionBuilder(
        account,
        {
          fee:
            StellarSdk.BASE_FEE,

          networkPassphrase:
            StellarSdk.Networks.TESTNET
        }
      )

      .addOperation(

        StellarSdk.Operation.manageData({

          name:
            matricula.slice(0,64),

          value:
            hashHex.slice(0,64)

        })

      )

      .setTimeout(30)

      .build()

    /*
      SIGN REAL
    */

    const signed =
      await signTransaction(
        tx.toXDR(),
        {
          networkPassphrase:
            StellarSdk.Networks.TESTNET
        }
      )

    /*
      REBUILD
    */

    const signedTx =
      StellarSdk.TransactionBuilder
        .fromXDR(
          signed.signedTxXdr,
          StellarSdk.Networks.TESTNET
        )

    /*
      SUBMIT REAL
    */

    const result =
      await server.submitTransaction(
        signedTx
      )
    console.log(
    "SUBMIT RESULT", result
              )
    /*
      EXPLORER REAL
    */

    const explorerUrl =
      `https://stellar.expert/explorer/testnet/tx/${result.hash}`

    /*
      RENDER
    */

    document.getElementById(
      "status"
    ).innerHTML = `

      <p class="success">
        Hash ancorado!
      </p>

      <p>
        SHA-256
      </p>

      <small>
        ${hashHex}
      </small>

      <p>
        TX Hash REAL
      </p>

      <small>
        ${result.hash}
      </small>

      <br><br>

      <a
        href="${explorerUrl}"
        target="_blank"
      >
        Ver Explorer
      </a>

    `

  } catch(err){

    console.error(err)

    document.getElementById(
      "status"
    ).innerHTML = `

      <p class="error">
        ${err.message}
      </p>

    `
  }
}

/*
  AUDITORIA
*/

async function auditHash(){

  try{

    const matricula =
      document.getElementById(
        "consultaMatricula"
      ).value

    const valorAtual =
      document.getElementById(
        "consultaValor"
      ).value

    const record =
      localHashes[matricula]

    if(!record){

      document.getElementById(
        "auditResult"
      ).innerHTML = `

        <p class="error">
          Matrícula não encontrada
        </p>

      `

      return
    }

    const originalData =
      JSON.parse(
        record.payload
      )

    const payloadAtual =
      JSON.stringify({

        matricula,

        valor:
          valorAtual,

        timestamp:
          originalData.timestamp

      })

    const recalculatedHash =
      await generateSHA256(
        payloadAtual
      )

    const integrity =
      recalculatedHash ===
      record.hash

    document.getElementById(
      "auditResult"
    ).innerHTML = `

      <p class="${
        integrity
          ? "success"
          : "error"
      }">

        ${
          integrity
            ? "Registro íntegro"
            : "ALTERAÇÃO DETECTADA"
        }

      </p>

    `

  } catch(err){

    console.error(err)
  }
}

/*
  EVENTOS
*/

document
  .getElementById("connectBtn")
  .addEventListener(
    "click",
    connectWallet
  )

document
  .getElementById("anchorBtn")
  .addEventListener(
    "click",
    anchorHash
  )

document
  .getElementById("auditBtn")
  .addEventListener(
    "click",
    auditHash
  )

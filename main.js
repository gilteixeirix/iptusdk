import {
  Horizon,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation
}
from "https://esm.sh/@stellar/stellar-sdk"

import {
  getAddress,
  signTransaction
}
from "https://esm.sh/@stellar/freighter-api"

console.log("MAIN JS OK")

const server =
  new Horizon.Server(
    "https://horizon-testnet.stellar.org"
  )

let publicKey = ""

const localHashes = {}

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

window.connectWallet =
  async function(){

    try{

      const result =
        await getAddress()

      publicKey =
        result.address

      /*
        TESTE REAL
      */

      await server.loadAccount(
        publicKey
      )

      document.getElementById(
        "walletAddress"
      ).innerText =
        publicKey

      alert(
        "Wallet REAL conectada!"
      )

      console.log(
        "PUBLIC KEY:",
        publicKey
      )

    } catch(err){

      console.error(err)

      alert(err.message)
    }
}

/*
  ANCHOR
*/

window.anchorHash =
  async function(){

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

      if(!matricula || !valor){

        alert(
          "Preencha os campos"
        )

        return
      }

      const payload =
        JSON.stringify({

          matricula,
          valor,

          timestamp:
            new Date()
              .toISOString()

        })

      const hashHex =
        await generateSHA256(
          payload
        )

      localHashes[matricula] = {

        payload,
        hash: hashHex

      }

      document.getElementById(
        "status"
      ).innerHTML = `

        <p>
          Gerando transação...
        </p>

      `

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
        new TransactionBuilder(
          account,
          {
            fee:
              BASE_FEE,

            networkPassphrase:
              Networks.TESTNET
          }
        )

        .addOperation(

          Operation.manageData({

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
              Networks.TESTNET
          }
        )

      /*
        REBUILD
      */

      const signedTx =
        TransactionBuilder
          .fromXDR(
            signed.signedTxXdr,
            Networks.TESTNET
          )

      /*
        SUBMIT REAL
      */

      const result =
        await server.submitTransaction(
          signedTx
        )

      console.log(
        "SUBMIT RESULT",
        result
      )

      const explorerUrl =
        `https://stellar.expert/explorer/testnet/tx/${result.hash}`

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
          TX Hash
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

window.auditHash =
  async function(){

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

        <p>
          Hash Original
        </p>

        <small>
          ${record.hash}
        </small>

        <p>
          Hash Atual
        </p>

        <small>
          ${recalculatedHash}
        </small>

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

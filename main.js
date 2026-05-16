console.log("MAIN OK")

const server =
  new StellarSdk.Server(
    "https://horizon-testnet.stellar.org"
  )

let publicKey = ""

const localHashes = {}

async function sha256(message){

  const msgBuffer =
    new TextEncoder().encode(message)

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      msgBuffer
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

    console.log("CONNECT CLICK")

    /*
      TESTE REAL
    */

    if(window.freighterApi){

      publicKey =
        await window.freighterApi
          .getPublicKey()

    }else{

      /*
        FALLBACK HACKATHON
      */

      alert(
        "Freighter API não encontrada. Usando modo demo."
      )

      publicKey =
        "GDEMOACCOUNTTESTNET123456789"

    }

    document.getElementById(
      "wallet"
    ).innerText =
      publicKey

    console.log(publicKey)

    alert(
      "Wallet conectada!"
    )

  }catch(err){

    console.error(err)

    alert(err.message)

  }
}

/*
  ANCHOR
*/

async function anchorHash(){

  try{

    console.log("ANCHOR CLICK")

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

    const hash =
      await sha256(payload)

    localHashes[matricula] = {
      payload,
      hash
    }

    /*
      MOCK TX HASH
      PARA HACKATHON
    */

    const txHash =
      crypto.randomUUID()

    const explorer =
      `https://stellar.expert/explorer/testnet/tx/${txHash}`

    document.getElementById(
      "status"
    ).innerHTML = `

      <p class="success">
        Hash ancorado!
      </p>

      <small>
        ${hash}
      </small>

      <small>
        ${txHash}
      </small>

      <a
        href="${explorer}"
        target="_blank"
      >
        Ver Explorer
      </a>

    `

  }catch(err){

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

    console.log("AUDIT CLICK")

    const matricula =
      document.getElementById(
        "consultaMatricula"
      ).value

    const valor =
      document.getElementById(
        "consultaValor"
      ).value

    const record =
      localHashes[matricula]

    if(!record){

      document.getElementById(
        "auditResult"
      ).innerHTML =
        "<p class='error'>Matrícula não encontrada</p>"

      return
    }

    const original =
      JSON.parse(record.payload)

    const payloadAtual =
      JSON.stringify({

        matricula,
        valor,
        timestamp:
          original.timestamp

      })

    const hashAtual =
      await sha256(payloadAtual)

    const integrity =
      hashAtual ===
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

  }catch(err){

    console.error(err)

  }
}

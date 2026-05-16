import {
  getAddress
}
from "https://esm.sh/@stellar/freighter-api"

window.connectWallet =
  async function(){

    try{

      const result =
        await getAddress()

      console.log(result)

      alert(
        result.address
      )

    }catch(err){

      console.error(err)

      alert(err.message)

    }
}

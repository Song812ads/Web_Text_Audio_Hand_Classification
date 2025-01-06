import React from 'react'

class GetPost{

    async getData(url){
    const request = {
        method: 'GET',
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin' : 'origin',
            'Access-Control-Allow-Headers':'Content-Type, Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Credentials' : true,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer ' + auth.user.access_token
    }
    }
          await fetch(url,request)
          .then((response)=>response.json())
          .then((response)=>{
            return response
          })
          .catch((e)=>{
            console.log(e)
          })
}

async postData(url, formData) {
    const request = {
        method: 'POST',
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin' : 'origin',
            'Access-Control-Allow-Headers':'Content-Type, Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Credentials' : true,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer ' + auth.user.access_token
    },
    body: formData
}
      const response = await fetch(url, request)
      return response
                            
  }

}

export default GetPost
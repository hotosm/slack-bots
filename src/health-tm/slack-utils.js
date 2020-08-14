const fetch = require('node-fetch')

const sendToSlack = async (responseURL, message) => {
  await fetch(responseURL, {
    method: 'post',
    body: JSON.stringify(message),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

module.exports = { sendToSlack }

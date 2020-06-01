"use strict";

const fetch = require("node-fetch");

const TM_URL =
  "https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/heartbeat/";

const createBlock = (status) => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        status === "healthy"
          ? ":white_check_mark: The Tasking Manager is operational"
          : ":heavy_exclamation_mark: The Tasking Manager cannot be reached",
    },
  };
};

module.exports.healthTM = async () => {
  const taskingManagerResponse = await fetch(TM_URL);
  const responseJSON = await taskingManagerResponse.json();
  const status = responseJSON.status;

  const slackMessage = {
    blocks: [createBlock(status)],
  };

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(slackMessage),
  };
};

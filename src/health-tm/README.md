# /health-tm Slack slash command
Checks the status of the Tasking Manager and return its current status plus other pertinent information such as number of mappers currently online and total number of projects hosted in Tasking Manager

## How to use
Write `/health-tm` in the message field of any Slack channel or direct message. The result will be showed only to the user who called the command.


## Dependencies
This command calls the Tasking Manager API:

[API Reference](https://tasks.hotosm.org/api-docs)

`/api/v2/system/heartbeat/` - returns status 200 if TM is healthy

`/api/v2/system/statistics/` - returns HomePage Stats


## Expected result
![health-tm](https://user-images.githubusercontent.com/54427598/87404675-8f0e2000-c612-11ea-920e-cd3b7292dcca.png)

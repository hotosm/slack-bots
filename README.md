# Slack Bot

## Description
This Slack bot utilises the Slack API to implement commands and automate tasks to improve HOT's internal communications and make it easier for members to get information from HOT tools.

## Architecture and structure
![slack-router](https://user-images.githubusercontent.com/12103383/84057200-f6620000-a9d4-11ea-9b74-fd4ecd9eb27b.png)

### Folder structure
Each commands has its own folder within the repo.

## Existing commands and features
### Slash Commands
* [`/health-tm`](https://github.com/hotosm/slack-bots/tree/master/src/health-tm) - Return the status of the Tasking Manager and other stats

* [`/health-leaderboard`](https://github.com/hotosm/slack-bots/tree/master/src/health-leaderboard) - Returns the status of the Missing Maps Leaderboard

* [`/osmcha-stats`](https://github.com/hotosm/slack-bots/tree/master/src/osmcha-stats) - Returns stats on changesets filtered based on project ID or hashtag(s)

* [`/tm-stats`](https://github.com/hotosm/slack-bots/tree/master/src/tm-stats) - Returns stats on the Tasking Manager, projects, or users

### Features
* Github label filter ?
* Welcome bot ?

## Contribute
### Picking up issues to complete in existing commands
1. Fork repo
2. Create your own branch
3. NPM install inside the command directory
4. Create changes needed in lambda file
5. Submit pull request

### Creating new command
1. Fork repo
2. Create your own branch
3. Create command directory (same name as command)
4. NPM init and setup new package.json
5. Create folder called 'cloudformation' to store CloudFormation template
6. Create Cloudformation template (be careful about naming)
    * Lambda function
    * Lambda IAM role (principle of least priveleged)
    * Lambda permission (logs, allowing SNS to call Lambda, access Parameter Store if needed)
    * SNS (SNS name need to match command in Slack)
7. Create Lambda
10. Submit pull request


Talk about testing? 
Explain how they can test their commands while making it
Put what a request payload from Slack (that has gone through SNS) looks like
Talk about OSMCha and Tasking Manager API tokens if they require it
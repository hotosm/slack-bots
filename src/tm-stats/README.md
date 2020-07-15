# /tm-stats Slack slash command
Checks the status of the Tasking Manager and return its current status plus other pertinent information such as number of mappers currently online and total number of projects hosted in Tasking Manager

## How to use
Write `/tm-stats [parameters]` in the message field of any Slack channel or direct message. The result will be showed only to the user who called the command.

The command will return different information depending on which parameters you use:

* `/tm-stats` to gets stats on the Tasking Manager home page

* `/tm-stats [projectID]` to get stats on a specified Tasking Manager project (e.g. `/tm-stats 8172`)

* `/tm-stats [username]` to get stats on a specified user (e.g. `/tm-stats Charlie Brown`)

* `/tm-stats [projectID username]` to get stats on a specified user's contribution in a specified Tasking Manager project (e.g. `/tm-stats 8172 Charlie Brown`)

* `tm-stats help` to get information on how to use the command


## Dependencies
This command calls the Tasking Manager API:

[Tasking Manager API Reference](https://tasks.hotosm.org/api-docs)

`/system/statistics/` - returns HomePage Stats

`/projects/{project_id}/queries/summary/` - returns specified project summary

`/projects/{project_id}/statistics/` - returns specified project stats

`/projects/{project_id}/statistics/queries/{username}/` - returns detailed stats on a user's contribution in a project 

`/users/{username}/statistics/` - returns detailed stats about a user by OpenStreetMap username



## Expected results
`/tm-stats`:
![tm-stats](https://user-images.githubusercontent.com/54427598/87522743-15da0000-c6da-11ea-8fe8-0c25891af02a.png)

`/tm-stats [projectID]`:
![tm-stats-project](https://user-images.githubusercontent.com/54427598/87519968-6fd8c680-c6d6-11ea-9040-8dff25378523.png)

`/tm-stats [username]`:
![tm-stats-user](https://user-images.githubusercontent.com/54427598/87519964-6f403000-c6d6-11ea-8b5f-d2158b89fbf8.png)

`/tm-stats [projectID username]`
![tm-stats-project-user](https://user-images.githubusercontent.com/54427598/87519967-6f403000-c6d6-11ea-85ce-f4e2137ca1bc.png)

`tm-stats help`:
![tm-stats-help](https://user-images.githubusercontent.com/54427598/87519958-6e0f0300-c6d6-11ea-98b6-071eff23eaea.png)

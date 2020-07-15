# /osmcha-stats Slack slash command
Allows users to filter changesets based on project ID or hashtag(s) and returns stats on the changesets including the number of suspicious changesets and a list of flags.

## How to use
 * `/osmcha-stats [projectID]` to get stats on changesets of a Tasking Manager project (e.g. `/osmcha-stats 8172`)

 * `/osmcha-stats [hashtags]` to get stats on changesets with specific hashtags (e.g. `/osmcha-stats #covid19 #hotosm-project-8272`)

* `/osmcha-stats help` to get information on how to use the command

Occassionally when filtering by hashtags the number of changesets may be too many to show, in this instance it will be further filtered to only show results from the last month. If the number of changesets is still too many, the Slackbot will advice the user to add more hashtags.

The result will be showed only to the user who called the command.

## Dependencies
This command calls the Tasking Manager API and the OSMCha API:

[Tasking Manager API Reference](https://tasks.hotosm.org/api-docs)

`/projects/{project_id}/` - returns info on specified project including area

[OSMCha API Reference](https://osmcha.org/api-docs/)

`/changesets/suspect/{filters}` - returns suspect changesets matching filters

`/stats/{filters}` - returns stats about changesets matching filters including number of harmful changesets by suspicion reason and tag.


## Expected result
Filtering by project ID (`/osmcha-stats [projectID]`):
![Screen Shot 2020-07-15 at 19 17 47](https://user-images.githubusercontent.com/54427598/87515724-5cc2f800-c6d0-11ea-9c7b-0fe29049838b.png)

Filtering by hashtag(s) (`/osmcha-stats [hashtags]`):
![Screen Shot 2020-07-15 at 19 20 22](https://user-images.githubusercontent.com/54427598/87515714-59c80780-c6d0-11ea-8f90-1eb43db4bbd1.png)

Command helper (`/osmcha-stats help`):
![Screen Shot 2020-07-15 at 19 29 59](https://user-images.githubusercontent.com/54427598/87516556-b5df5b80-c6d1-11ea-97d9-879f5675625a.png)



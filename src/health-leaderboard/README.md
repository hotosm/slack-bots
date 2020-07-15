# /health-leaderboard Slack slash command
Checks the current augmented diff that the Missing Maps Leaderboard is processing and compares this to the latest [Overpass API augmented diff](https://wiki.openstreetmap.org/wiki/Overpass_API/Augmented_Diffs) to allow users to know if the leaderboard is up-to-date.

## How to use
Write `/health-leaderboard` in the message field of any Slack channel or direct message. The result will be showed only to the user who called the command.


## Dependencies
This command calls the Overpass API and the OSM Stats API:

[Overpass API Reference](https://www.overpass-api.de/)

`/api/augmented_diff_status/` - returns the latest available augmented diff

[OSM Stats API Reference](https://github.com/AmericanRedCross/osm-stats/blob/master/documentation/API.md)

`/status/` - returns metrics from the OSM changeset JSON


## Expected result
![health-leaderboard](https://user-images.githubusercontent.com/54427598/87404630-80276d80-c612-11ea-8316-02ca8a1b5101.png)


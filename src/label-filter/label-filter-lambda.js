
var https = require("https");

const link = (url, txt) => {
return "<" + url + "|" + txt + ">";
}
 
exports.handler = function(event, context, callback) {
    console.log(event)
    var ghEvent = event
    console.log(ghEvent.repository.name)

    if (ghEvent.action === 'labeled') {
        console.log(ghEvent.action)
        var eventType = ghEvent.action
        var issueNumber = ghEvent.issue.number;
        var whoLabeled = link(ghEvent.sender.html_url, ghEvent.sender.login)
        var whatAction = ghEvent.action
        var whatLabel = ghEvent.label.name
        var whichRepo = link(ghEvent.repository.html_url, ghEvent.repository.name)
        var whatIssue = link(ghEvent.issue.url, ghEvent.issue.title)
        var slackMessage = whoLabeled + " " + whatAction + " " + whatIssue  + " in " + whichRepo + " as '" + whatLabel + "'";

        if (ghEvent.label.name === 'good first issue' || 
            ghEvent.label.name === 'Easy Difficulty' ||
            ghEvent.label.name === 'Hacktoberfest' ||
            ghEvent.label.name === 'Guidance Included' ||
            ghEvent.label.name === 'hacktoberfest'){

                var req = https.request({
                    hostname: "hooks.slack.com",
                    port: 443,
                    path: "/services/T042TUWCB/BF0E29A1H/24beTywXeYVpBV61bkG0HfZ7", 
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json"
                    }
                    }, function(res) {
                    console.log("Slack hook response status code: " + res.statusCode);
                    context.succeed();
                    });
 
                req.on("error", function(err) {
                console.log("Slack request error: " + JSON.stringify(err));
                context.fail(err.message);
                });
 
                req.write(JSON.stringify({
                text: slackMessage
                }));
                
                req.end();
        } else if(ghEvent.label.name === 'ML4TM Design' ||
                  ghEvent.label.name === 'ml4tm '){
  
                var req = https.request({
                    hostname: "hooks.slack.com",
                    port: 443,
                    path: "/services/T042TUWCB/BGKRPS7H7/YiPAKKOMjNiGjrVu4xwud6wn", 
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json"
                    }
                }, function(res) {
                console.log("Slack hook response status code: " + res.statusCode);
                context.succeed();
                });
 
                req.on("error", function(err) {
                console.log("Slack request error: " + JSON.stringify(err));
                context.fail(err.message);
                });
                
                req.write(JSON.stringify({
                text: slackMessage
                }));
                
                req.end();
  
        } else {
            context.fail("Invalid event type");
        }
 
    }


    const response = {
          statusCode: 200,
          body: JSON.stringify({
          message: "Event processed"
            }),
    };
    callback(null, response);
};

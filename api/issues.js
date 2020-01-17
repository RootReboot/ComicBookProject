const express = require("express");
const issuesRouter = express.Router({ mergeParams: true });
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

issuesRouter.param("issueId", (req, res, next, issueId) => {
  const sql = "SELECT * FROM Issue WHERE id = $issueId";
  const values = { $issueId: issueId };
  db.get(sql, values, (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      req.issue = issue;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

issuesRouter.get("/", (req, res, next) => {
  const sql = "SELECT * FROM Issue WHERE series_id = $seriesId";
  const values = { $seriesId: req.params.seriesId };
  db.all(sql, values, (err, issues) => {
    if (err) {
      next(err);
    }
    res.status(200).json({ issues: issues });
  });
});

const validateIssuesRequest = (req, res, next) => {
  const issue = req.body.issue;

  if (
    !issue.name ||
    !issue.issueNumber ||
    !issue.publicationDate ||
    !issue.artistId
  ) {
    return res.sendStatus(400);
  } else {
    next();
  }
};

issuesRouter.post("/", validateIssuesRequest, (req, res, next) => {
  const issue = req.body.issue;

  const artistSql = "SELECT * FROM Artist WHERE Artist.id = $artistId";
  const artistValues = { $artistId: issue.artistId };
  db.get(artistSql, artistValues, (error, artist) => {
    if (error) {
      next(error);
    } else {
      const sql =
        "INSERT INTO Issue (name, issue_Number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)";

      const issue = req.body.issue;
      const value = {
        $name: issue.name,
        $issueNumber: issue.issueNumber,
        $publicationDate: issue.publicationDate,
        $artistId: issue.artistId,
        $seriesId: req.params.seriesId
      };

      db.run(sql, value, function(error) {
        if (error) {
          next(error);
        } else {
          const sql = "SELECT * FROM Issue WHERE id = $issuesId";
          const value = { $issuesId: this.lastID };
          db.get(sql, value, (err, issue) => {
            if (err) {
              next(err);
            } else {
              res.status(201).json({ issue: issue });
            }
          });
        }
      });
    }
  });
});

issuesRouter.put("/:issueId", validateIssuesRequest, (req, res, next) => {
  const newIssue = req.body.issue;
  const issueId = Number(req.params.issueId);
  if (!newIssue.id || newIssue.id !== issueId) {
    newIssue.id = issueId;
  }

  const artistSql = "SELECT * FROM Artist WHERE Artist.id = $artistId";
  const artistValues = { $artistId: newIssue.artistId };
  db.get(artistSql, artistValues, (err, artist) => {
    if (err) {
      next(err);
    } else {
      if (!artist) {
        return res.sendStatus(400);
      } else {
        const sql =
          "UPDATE Issue SET name = $name, issue_number = $issueNumber, " +
          "publication_date = $publicationDate, artist_id = $artistId " +
          "WHERE Issue.id = $issueId";

        const value = {
          $name: newIssue.name,
          $issueNumber: newIssue.issueNumber,
          $publicationDate: newIssue.publicationDate,
          $artistId: newIssue.artistId,
          $issueId: newIssue.id
        };

        db.run(sql, value, function(err) {
          if (err) {
            next(err);
          } else {
            const sql = "SELECT * FROM Issue WHERE id = $issueId";
            const value = { $issueId: newIssue.id };
            db.get(sql, value, (err, issue) => {
              if (err) {
                next(err);
              } else {
                res.status(200).json({ issue: issue });
              }
            });
          }
        });
      }
    }
  });
});

issuesRouter.delete("/:issueId", (req, res, next) => {
  const sql = "DELETE FROM Issue WHERE Issue.id = $issueId";
  const values = { $issueId: req.params.issueId };

  db.run(sql, values, error => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = issuesRouter;

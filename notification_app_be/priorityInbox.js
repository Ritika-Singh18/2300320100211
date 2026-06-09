require("dotenv").config();

const PRIORITY = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function getTopNotifications(notifications, n = 10) {
  return notifications
    .sort((a, b) => {
      const priorityDiff =
        PRIORITY[b.Type] - PRIORITY[a.Type];

      if (priorityDiff !== 0) return priorityDiff;

      return (
        new Date(b.Timestamp) -
        new Date(a.Timestamp)
      );
    })
    .slice(0, n);
}

module.exports = getTopNotifications;
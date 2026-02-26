/**
 * @type {MiraiModule["config"]}
 */
module.mirai.config = {
  name: "uid",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Mirai Team",
  description: "Get the user's Facebook UID.",
  usePrefix: true,
  commandCategory: "other",
  cooldowns: 5,
};

/**
 * @type {MiraiModule["run"]}
 */
module.mirai.run = function ({ api, event }) {
  if (Object.keys(event.mentions).length === 0) {
    if (event.messageReply) {
      const senderID = event.messageReply.senderID;
      return api.sendMessage(senderID, event.threadID);
    } else {
      return api.sendMessage(
        `${event.senderID}`,
        event.threadID,
        event.messageID,
      );
    }
  } else {
    for (const mentionID in event.mentions) {
      const mentionName = event.mentions[mentionID];
      api.sendMessage(
        `${mentionName.replace("@", "")}: ${mentionID}`,
        event.threadID,
      );
    }
  }
};

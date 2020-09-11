const { canModifyQueue } = require("../util/EvobotUtil");

module.exports = {
  name: "loop",
  aliases: ['l'],
  description: "음악 반복재생",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.reply("음악을 재생해주세요.").catch(console.error);
    if (!canModifyQueue(message.member)) return;

    // toggle from false to true and reverse
    queue.loop = !queue.loop;
    return queue.textChannel
      .send(`음악 반복이 ${queue.loop ? "활성화 되었습니다." : "비활성화 되었습니다."}`)
      .catch(console.error);
  }
};

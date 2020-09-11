const { MessageEmbed } = require("discord.js");
const lyricsFinder = require("lyrics-finder");

module.exports = {
  name: "lyrics",
  aliases: ["ly"],
  description: "음악 가사 불러오기",
  async execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.channel.send("노래를 재생해주세요.").catch(console.error);

    let lyrics = null;

    try {
      lyrics = await lyricsFinder(queue.songs[0].title, "");
      if (!lyrics) lyrics = `${queue.songs[0].title}의 가사가 검색되지 않았습니다.`;
    } catch (error) {
      lyrics = `${queue.songs[0].title}의 가사가 검색되지 않았습니다.`;
    }

    let lyricsEmbed = new MessageEmbed()
      .setTitle("Lyrics")
      .setDescription(lyrics)
      .setColor("#F8AA2A")
      .setTimestamp();

    if (lyricsEmbed.description.length >= 2048)
      lyricsEmbed.description = `${lyricsEmbed.description.substr(0, 2045)}...`;
    return message.channel.send(lyricsEmbed).catch(console.error);
  }
};

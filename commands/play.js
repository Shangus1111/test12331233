const { play } = require("../include/play");
const { YOUTUBE_API_KEY, SOUNDCLOUD_CLIENT_ID } = require("../config.json");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const scdl = require("soundcloud-downloader");

module.exports = {
  name: "play",
  cooldown: 3,
  aliases: ["p"],
  description: "노래 검색 (유튜브)",
  async execute(message, args) {
    const { channel } = message.member.voice;

    const serverQueue = message.client.queue.get(message.guild.id);
    if (!channel) return message.reply("음성 채널에 접속해주세요.").catch(console.error);
    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message.reply(`${message.client.user}와 같은 음성 채널에 들어와주세요.`).catch(console.error);

    if (!args.length)
      return message
        .reply(`사용법: ${message.client.prefix}play <유튜브 링크 | 음악 이름>`)
        .catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.reply("음성 채널에 접속할 권한이 없습니다.");
    if (!permissions.has("SPEAK"))
      return message.reply("마이크 사용 권한이 없습니다.");

    const search = args.join(" ");
    const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
    const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
    const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
    const url = args[0];
    const urlValid = videoPattern.test(args[0]);

    // Start the playlist if playlist url was provided
    if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
      return message.client.commands.get("playlist").execute(message, args);
    } else if (scdl.isValidUrl(url) && url.includes("/sets/")) {
      return message.client.commands.get("playlist").execute(message, args);
    }

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 50,
      playing: true
    };

    let songInfo = null;
    let song = null;

    if (urlValid) {
      try {
        songInfo = await ytdl.getInfo(url);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds
        };
      } catch (error) {
        console.error(error);
        return message.reply("오류").catch(console.error);
      }
    } else if (scRegex.test(url)) {
      try {
        const trackInfo = await scdl.getInfo(url, SOUNDCLOUD_CLIENT_ID);
        song = {
          title: trackInfo.title,
          url: trackInfo.permalink_url,
          duration: Math.ceil(trackInfo.duration / 1000)
        };
      } catch (error) {
        if (error.statusCode === 404)
          return message.reply("오류.").catch(console.error);
        return message.reply("오류.").catch(console.error);
      }
    } else {
      try {
        const results = await youtube.searchVideos(search, 1);
        songInfo = await ytdl.getInfo(results[0].url);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds
        };
      } catch (error) {
        console.error(error);
        return message.reply("검색된 음악이 없습니다").catch(console.error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      return serverQueue.textChannel
        .send(`✅ ${message.author}가 **${song.title}**를 목록에 추가했습니다.`)
        .catch(console.error);
    }

    queueConstruct.songs.push(song);
    message.client.queue.set(message.guild.id, queueConstruct);

    try {
      queueConstruct.connection = await channel.join();
      await queueConstruct.connection.voice.setSelfDeaf(true);
      play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(error);
      message.client.queue.delete(message.guild.id);
      await channel.leave();
      return message.channel.send(`오류: ${error}`).catch(console.error);
    }
  }
};

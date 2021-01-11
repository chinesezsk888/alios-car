Page({
  data: {
    skillResult:{}
  },
  onLoad() {
    if (my.canIUse(`aliauto.onSkillResult`)) {  // 判断新增 API 是否可用
      my.aliauto.onSkillResult((skillData) => { // 获取对话返回结果：skillData(json格式)
        let resJson = JSON.stringify(skillData);  // 转为字符串，页面显示、日志打印使用
        this.setData({  // 为绑定的变量赋值，此处用于在页面显示 对话返回结果
          skillResult: resJson
        });
        console.log("onLoad skill result:" + resJson);
        if (my.canIUse(`aliauto.say`) && skillData) {
          if ((skillData["domain"] == "miniapp_play_pause_news") && (skillData["intent"] == "play_news") && (skillData["slots"]["news_type"][0]["norm"] == "next")) {
            
          } else if ((skillData["domain"] == "miniapp_play_pause_news") && (skillData["intent"] == "play_news") && (skillData["slots"]["news_type"][0]["norm"] == "previous")) {

          } else if ((skillData["domain"] == "miniapp_play_pause_news") && (skillData["intent"] == "play_news") && (skillData["slots"]["news_type"][0]["norm"] == "selection_news")) {

          } else if ((skillData["domain"] == "miniapp_play_pause_news") && (skillData["intent"] == "play_news") && (skillData["slots"]["news_type"][0]["norm"] == "24hot_news")) {

          } else if ((skillData["domain"] == "miniapp_play_pause_news") && (skillData["intent"] == "play_news") && (typeof(skillData["slots"]["news_type"])=="undefined")) {
            
          } else if ((skillData["domain"] == "miniapp_play_pause_news") && (skillData["intent"] == "pause_news")) {
            
          } else {
            
          }
        };
      });
    }
  },
});

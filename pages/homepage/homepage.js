import { getRequest } from '/utils/api';
import getBasicClass from '/utils/size';
//const UrlBase = 'http://ceshihttps.thepaper.cn/wap/v6/jsp/'
const UrlBase = 'https://m.thepaper.cn/'
Page({
  data: {
    tabs:[{
      title:'精选要闻'
    },{
      title:'24小时最热'
    }],
    activeTab: 0, // 展示tab
    audioTab:0, // 播放tab
    isFirstPlay:0, // 0第一次播放 1显示下载APP 2不显示下载APP
  
    isShowQr:false,
    isShowMoreTxt:false,
    isLoadingMore:false,
    nextUrl:'',

    tipsVoiceSrc:'', //间隔音频链接
    qrCodePic:'',  //二维码图片
    defaultQrCode:"/public/images/audio/audio-loading.gif",

    currentListIndex:-1, // 文章列表索引
    selectNews:{
      scrollTop:0,
      errorType:'',
      contList:[]
    },
    hotNews:{
      scrollTop:0,
      errorType:'',
      contList:[]
    },
    defaultThumb:'https://testimagecloud.thepaper.cn/testthepaper/image/8/512/219.png',
    audio:{
      isPlay:false, //是否播放
      title:"播放全部精选要闻", //音频标题
      src:"", //音频src
      hasNext:false, // 是否有下一个
      hasPrev:false // 是否有下一个
    },
    swiperList:[],
    swiperCurrent:0, //当前选中id
    swiperIndex:0, //当前选中索引 改变值会改变轮播
    listTwoClass:"" // 超长横屏特有样式
  },
  onLoad() {

    if (my.canIUse(`aliauto.onSkillResult`)) {  // 判断新增 API 是否可用
      my.aliauto.onSkillResult((skillData) => { // 获取对话返回结果：skillData(json格式)
        let resJson = JSON.stringify(skillData);  // 转为字符串，页面显示、日志打印使用
        console.log("onLoad skill result:" + resJson);
        this.analysisVocal(skillData)
      });
    }
    
    getBasicClass().then(res=>{ // 获取系统屏幕信息
      const { basicSize,basicClass,windowWidth } = res
      let listTwoClass = ""
      if(basicClass=='heng_view'&&windowWidth>=1646){
        listTwoClass = "view_two"
      }
      // my.alert({content:windowWidth})  960
      // 横屏，但是是小卡 todo

      this.setData({
        basicSize,
        basicClass,
        listTwoClass
      })
    })
    //获取数据
    this.getNewsList()
    this.getHotList()
    //音频处理，音频回调注册
    this.backgroundAudioManager =  my.getBackgroundAudioManager();
    this.backgroundAudioManager.onPlay(()=>{
      let audioObj = this.data.audio
      this.setData({
        audio:{
          ...audioObj,
          isPlay:true
        }
      })
    })
    this.backgroundAudioManager.onPause(()=>{
      my.uma.trackEvent("1", { "type":"暂停" });
      this.setData({
        audio:{
          ...this.data.audio,
          isPlay:false
        }
      })
    })
    this.backgroundAudioManager.onError((e)=>{
      if(e.data.errCode != 10007){
        my.alert({content: '网络连接异常，音频加载失败'});
      }
      my.uma.trackEvent("4", { "type":"av播放器播放失败" });
      this.setData({
        audio:{
          ...this.data.audio,
          isPlay:false
        }
      })
    })
    this.backgroundAudioManager.onNext((e)=>{
      this.onAudioNext()
    })
    this.backgroundAudioManager.onEnded(() => {
      if(this.backgroundAudioManager.src == this.data.tipsVoiceSrc){
        this.onAudioNext()
      }else{
        this.backgroundAudioManager = my.getBackgroundAudioManager();
        this.backgroundAudioManager.pause()
        this.backgroundAudioManager.src = this.data.tipsVoiceSrc
        this.backgroundAudioManager.play()
      }
    })
  },
  // 解析语音
  analysisVocal(skillData){
    if ((skillData["domain"] == "miniapp_play_pause_news") && (skillData["intent"] == "play_news")){
      const norm = skillData["slots"]["news_type"]&&skillData["slots"]["news_type"][0]["norm"]
      switch (norm) {
        case "next":
          console.log("analysisVocal 下一篇")
          my.uma.trackEvent("5", { "intent":"下一篇" });
          if(!this.data.audio.hasNext && this.data.isFirstPlay!==0 && my.canIUse(`aliauto.say`)){
            my.aliauto.say({
              spokenText: "已是最后一篇新闻",
              writtenText:"已是最后一篇新闻",
              tips: "tips"
            });
          } else {
            this.movePlay()
          }
          break;
        case "previous":
          console.log("analysisVocal 上一篇")
          my.uma.trackEvent("5", { "intent":"上一篇" });
          if(!this.data.audio.hasPrev && my.canIUse(`aliauto.say`)){
            my.aliauto.say({
              spokenText: "已是第一篇新闻",
              writtenText:"已是第一篇新闻",
              tips: "tips"
            });
          } else {
            this.movePlay(1)
          }
          break;
        case "24hot_news":
          console.log("analysisVocal 24小时")
          my.uma.trackEvent("5", { "intent":"播放全部24小时" });
          this.playList(1)
          break;
        case "selection_news":
          console.log("analysisVocal 精选")
          my.uma.trackEvent("5", { "intent":"播放精选" });
          this.playList(0)
          break;
        default:
          console.log("analysisVocal 播放")
          my.uma.trackEvent("5", { "intent":"播放" });
          this.onAudioPlay()
          break;
      }
    } else if ((skillData["domain"] == "miniapp_play_pause_news") && (skillData["intent"] == "pause_news")) {
      console.log("暂停")   
      my.uma.trackEvent("5", { "intent":"暂停" });
      this.onAudioPause()
    } else {
      
    }
  },
  // 获取精选要闻
  getNewsList() {
    getRequest({
      url:UrlBase+'alios_channel_list.jsp',
      success:(res)=>{
        const {selectNews} = this.data
        const list = [...selectNews.contList,...res.data.contList]
        if(list.length == 0){
          this.setData({
            selectNews:{
              ...selectNews,
              errorType:'1'
            }
          })
        }else{
          const {tipsVoiceSrc="",nextUrl="",qrCodePic=""} = res.data
          this.setData({
            selectNews:{
              ...selectNews,
              contList:list,
              errorType:''
            },
            swiperList:list,//给轮播列表赋值
            swiperCurrent:list[0].contId,//默认轮播为第一个
            tipsVoiceSrc,
            nextUrl,
            qrCodePic
          })
        }
      },
      fail:(res)=>{
        const {selectNews} = this.data
        this.setData({
          selectNews:{
            ...selectNews,
            errorType:'0'
          }
        })
      },
    })
  },
  // 获取24小时最热
  getHotList() {
    getRequest({
      url:UrlBase+'alios_channel_list.jsp?n=-1',
      success:(res)=>{
        const {hotNews} = this.data
        const list = [...hotNews.contList,...res.data.contList]
        if(list.length == 0){
          this.setData({
            hotNews:{
              ...hotNews,
              errorType:'1'
            }
          })
        }else{
          this.setData({
            hotNews:{
              ...hotNews,
              contList:list,
              errorType:''
            }
          })
        }
      },
      fail:(res)=>{
        const {hotNews} = this.data
        this.setData({
          hotNews:{
            ...hotNews,
            errorType:'0'
          }
        })
      },
    })
  },
  //加载更多
  addMore() {
    if(this.isLoadingMore){
      return 
    }
    this.isLoadingMore = true
    if(this.data.nextUrl != ""){
      getRequest({
        url:this.data.nextUrl,
        success:(res)=>{
          this.isLoadingMore = false

          const {nextUrl=""} = res.data
          const {selectNews} = this.data
          const list = [...selectNews.contList,...res.data.contList]
          this.setData({
            selectNews:{
              ...selectNews,
              contList:list
            },
            audio:{
              ...this.data.audio,
              hasNext:true
            },
            nextUrl:nextUrl
          })
        },
        fail:()=>{
          this.isLoadingMore = false
          my.alert({content: "加载失败，请重试"});
        }
      })
    }else {
      this.setData({
        isShowMoreTxt:true
      })
      this.isLoadingMore = false
    }
  },
  //重试 获取精选
  onRetrySelectNews() {
    const {selectNews} = this.data
    this.setData({
      selectNews:{
        ...selectNews,
        errorType:''
      }
    })
    this.getNewsList()
  },
  //重试 获取最热24小时
  onRetryHotNews() {
    const {hotNews} = this.data
    this.setData({
      hotNews:{
        ...hotNews,
        errorType:''
      }
    })
    this.getHotList()
  },
  // tab框点击回调
  handleTabClick({ index, tabsName }) {
    if(this.data.isFirstPlay == 0){
      const txt = ['播放全部精选要闻','播放全部24小时最热'][index]
      this.data.audioTab = index
      const contList = this.getContList()
      this.setData({
        audio:{
          ...this.data.audio,
          title:txt
        },
        audioTab:index,
        swiperIndex: 0,
        swiperCurrent: contList[0].contId,
        swiperList:contList
      })
    }
    this.setData({
      [tabsName]: index,
    });
  },
  // tab框点滑动回调
  handleTabChange({ index, tabsName }) {
    this.handleTabClick({ index, tabsName })
  },
  //显示二维码
  showQrcode(){
    this.setData({
      isShowQr:true
    })
  },
  //关闭二维码
  closeQrcode(){
    this.setData({
      isShowQr:false
    })
  },
  //显示推广app信息，应用执行阶段只展示一次
  _showAPPDownLoad(){
    this.setData({
      isFirstPlay:1
    })
    setTimeout(()=>{
      this.setData({
      isFirstPlay:2
    })
    },5000)
  },
  //点击卡片事件
  onCardClick({tab,item}){
    if(this.data.isFirstPlay == 0){
      this._showAPPDownLoad()
    }
    const contId = item.contId;
    this.data.audioTab = this.data.activeTab;
    const { contList,index } = this._setListItemByAudio(contId)
    
    const txt = ['要闻精选','24小时最热'][tab]
    my.uma.trackEvent('2', { 'type':txt });
    this.backgroundAudioManager = my.getBackgroundAudioManager();
    this.backgroundAudioManager.pause()
    this.backgroundAudioManager.src = item.voiceSrc
    this.backgroundAudioManager.title = item.name
    this.backgroundAudioManager.play()
    const {hasNext,hasPrev} = this.isHasNextPrev(contList,index)
    const audio = {
      isPlay:true, 
      title:item.name, 
      src:item.voiceSrc,
      hasNext,hasPrev
    }
    this.setData({
      audio,
      audioTab:this.data.activeTab
    })

    // 横屏联动轮播
    this.setData({
      swiperList:contList,
      swiperIndex: index,
      swiperCurrent: item.contId,
    });
  },
  // 根据播放状态修改列表数据状态
  _setListItemByAudio(contId){ 
    const contList = this.getContList()
    const {selectNews,hotNews} = this.data
    const index = contList.findIndex(item => {
      if(item.contId == contId) {
        return true;
      }
    })
    if(index<0){
      return
    }
    if(selectNews.contList[this.data.currentListIndex]){
      selectNews.contList[this.data.currentListIndex]["isFocus"] = false
    }
    if(hotNews.contList[this.data.currentListIndex]){
      hotNews.contList[this.data.currentListIndex]["isFocus"] = false
    }
    contList[index]["isFocus"] = true
    this.setData({
      hotNews,
      selectNews,
      currentListIndex:index
    });
    return {
      contList,
      index
    }
  },
  // 获取当前播放列表 虚拟列表每次重新获取
  getContList(){
    const {audioTab,selectNews,hotNews} = this.data
    let dealObj = {}
    if(audioTab == 0){
      dealObj = selectNews
    }else {
      dealObj = hotNews
    }
    return dealObj.contList
  },
  // 从头播放列表
  playList(tabType=-1){ //-1 与当前播放tab有关 0 播放精选 1 播放24小时 
    this.backgroundAudioManager = my.getBackgroundAudioManager();
    if(this.data.isFirstPlay === 0){
      this._showAPPDownLoad()
    }
    if(tabType==-1){
      tabType = this.data.activeTab;
    } 
    this.data.audioTab = tabType;
    const contList = this.getContList()
    const item = contList[0]
    this.backgroundAudioManager.src = item.voiceSrc
    this.backgroundAudioManager.title = item.name
    this.backgroundAudioManager.play()
    this.setData({
      audio:{
        isPlay:true, 
        title:item.name, 
        src:item.voiceSrc,
        hasNext:true 
      },
      audioTab:tabType,
      swiperIndex: 0,
      swiperCurrent: item.contId,
      swiperList:contList
    })
    this._setListItemByAudio(item.contId)
  },
  // 播放按钮回调
  onAudioPlay(){
    my.uma.trackEvent("1", { "type":"播放" });
  
    if(this.data.currentListIndex == -1){
      this.playList()
    } else {
      if(this.data.isFirstPlay === 0){
        this._showAPPDownLoad()
      }
      this.backgroundAudioManager = my.getBackgroundAudioManager();
      const contList = this.getContList()
      this.backgroundAudioManager.play()

      const {hasNext,hasPrev} = this.isHasNextPrev(contList,this.data.currentListIndex)
      this.setData({
        audio:{
          ...this.data.audio,
          isPlay:true,
          hasPrev,
          hasNext
        }
      })
    }

    
  },
  // 暂停按钮回调
  onAudioPause(){
    this.backgroundAudioManager = my.getBackgroundAudioManager();
    this.backgroundAudioManager.pause()
    this.setData({
      audio:{
        ...this.data.audio,
        isPlay:false
      }
    })
   
  },
  //是否有上一篇/下一篇
  isHasNextPrev(contList,index){
    const nextItem = contList[index+1]
    const prevItem = contList[index-1]
    let hasNext = true,hasPrev = true;
    if(nextItem == undefined){
      hasNext = false;
    }
    if(prevItem == undefined){
      hasPrev = false;
    }
    return {hasNext,hasPrev}
  }, 
  // 上一篇下一篇
  movePlay(type=0){ // type==0 下一篇 type==1 上一篇 
    const contList = this.getContList()
    let index;
    if(type===0){
      index = this.data.currentListIndex +1
    }else{
      index = this.data.currentListIndex -1
    }
    const item = contList[index]
    const {hasNext,hasPrev} = this.isHasNextPrev(contList,index)
    const audio = {
      isPlay:true, 
      title:item.name, 
      src:item.voiceSrc,
      hasNext,
      hasPrev
    }
    this.setData({
      audio
    })
    
    this.backgroundAudioManager = my.getBackgroundAudioManager();
    this.backgroundAudioManager.pause()
    this.backgroundAudioManager.src = item.voiceSrc
    this.backgroundAudioManager.title = item.name
    this.backgroundAudioManager.play()
    
    this._setListItemByAudio(item.contId)

    // 横屏联动轮播
    this.setData({
      swiperIndex: index,
      swiperCurrent: item.contId,
    });
  },
  // 上一篇按钮回调
  onAudioPrev(){
    my.uma.trackEvent("1", { "type":"上一篇" });
    this.movePlay(1)
  },
  // 下一篇按钮回调
  onAudioNext(){
    my.uma.trackEvent("1", { "type":"下一篇" });
    this.movePlay()
  },
  // 滑动轮播回调
  onSwiperChange(e){
    if(this.data.swiperIndex < e.detail.current){
      this.onAudioNext()
    }else {
      this.onAudioPrev()
    }
  },
  //测试语音
  testVocal(event){
    const type = event.target.dataset.type
    switch (type) {
      case "1":
        if(!this.data.audio.hasPrev && my.canIUse(`aliauto.say`)){
          my.aliauto.say({
            spokenText: "已是第一篇新闻",
            writtenText:"已是第一篇新闻",
            tips: "tips"
          });
        } else {
          this.movePlay(1)
        }
        break;
      case "2":
        if(!this.data.audio.hasNext && this.data.isFirstPlay!==0 && my.canIUse(`aliauto.say`)){
          my.aliauto.say({
            spokenText: "已是最后一篇新闻",
            writtenText:"已是最后一篇新闻",
            tips: "tips"
          });
        } else {
          this.movePlay()
        }
        break;
      case "3":
        this.onAudioPlay()
        break;
      case "4":
        this.onAudioPause()
        break;
      case "5":
        this.playList(0)
        break;
      case "6":
        this.playList(1)
        break;
      default:
        break;
    }
  }
});

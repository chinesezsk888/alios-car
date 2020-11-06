let app = getApp();
console.log(app)
let getScreenSize = async () => {
  let screenSize;
  if (app.globalData.screenSize) {
    screenSize = app.globalData.screenSize
  } else {
    screenSize = await my.getSystemInfo();
    app.globalData.screenSize = screenSize
    
  }
  return screenSize
};
let getBasicClass = async () => {
  const { screenWidth, screenHeight,windowHeight,windowWidth } = await getScreenSize();
  let basicClass,basicSize;
  if (screenHeight > screenWidth) {//竖屏状态
    basicClass = `shu_view`
  } else {//横屏状态
    basicClass = `heng_view`
    basicSize = `${(100/632).toFixed(3)}vh`
  }
  return { 
    basicClass,
    basicSize,
    windowHeight,
    windowWidth
  }
}
export default getBasicClass
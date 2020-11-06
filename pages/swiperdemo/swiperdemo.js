Page({
  data: {
    background: ['blue', 'red', 'yellow'],
    indicatorDots: true,
    autoplay: false,
    vertical: false,
    interval: 1000,
    circular: false,
    current:0
  },
  onLoad() {
  },
  changeIndicatorDots(e) {
    this.setData({
      indicatorDots: !this.data.indicatorDots,
    });
  },
  changeVertical() {
    this.setData({
      vertical: !this.data.vertical,
    });
  },
  changeCircular(e) {
    this.setData({
      circular: !this.data.circular,
    });
  },
  changeAutoplay(e) {
    console.log()
  },
  intervalChange(e) {
    this.setData({
      interval: e.detail.value,
    });
  },
  onChange(e){
    this.setData({
      current: e.detail.current,
    });
  }
});
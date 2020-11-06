Component({
  mixins: [],
  data: {
    hidePic:true,
    defaultThumb:'https://testimagecloud.thepaper.cn/testthepaper/image/8/512/219.png'
  },
  props: {
    item:{},
    tab:0,
    isFocus:false,
    onMyClick:Function
  },
  didMount() {},
  didUpdate() {},
  didUnmount() {},
  methods: {
    handleClick(){
      const {tab,item} = this.props
      if(this.props.onMyClick) {
        this.props.onMyClick({tab,item})
      }
    },
  },
});

Component({
  mixins: [],
  props: {
    errorType:'',
    onIntRetry: Function,
    onLoadRetry: Function,
  },
  didUnmount() {},
  methods: {
    intRetry() {
      if(this.props.onIntRetry) {
        this.props.onIntRetry()
      }
    },
    loadRetry() {
      if(this.props.onLoadRetry) {
        this.props.onLoadRetry()
      }
    }
  },
});

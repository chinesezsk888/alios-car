const getRequest = ({url,success,fail})=> {
  my.showLoading();
  my.request({
    url: url,
    method: 'GET',
    dataType: 'json',
    success: function(res) {
      if(success) {
        success(res)
      }
    },
    fail: function(res) {
      // {"data":"请求超时异常", "error":14, "headers": "{…}", "status":13, "errorMessage": "JSON parse data error"} 
      my.uma.trackEvent("4", { "type":"请求server_api超时" });
      if(fail) {
        fail(res)
      }
    },
    complete: function(res) {
      my.hideLoading();
    }
  });
}

export {
  getRequest
} ;
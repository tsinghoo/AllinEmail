
window.mailView =
  window.mailView ||
  (function () {
    var self = {
      items: null,
      lastSuccessTime__: 0,
      initialize: function () {
        share.debug__("mailView.init");
        window.addEventListener('message', self.messageHandler);
        self.changeLinkTarget__();
      },
      changeLinkTarget__:function(){
        
      },
      messageHandler: (event) => {
        let data = event.data;
        share.debug__("mailView: message received");
        let js = JSON.parse(data);
        share.debug__(js.action);

        if (js.action == "capture") {
          const whole = document.body;
          if (whole == null) {
            whole = document.documentElement;
          }

          html2canvas(whole).then(canvas => {
            const dataURL = canvas.toDataURL('image/jpeg');
            let json = {
              action: "capture",
              data: dataURL
            };

            event.source.postMessage(JSON.stringify(json), "*");
          });
        }
      }
    };

    $(function () {
      self.initialize();
    });

    return self;
  })();


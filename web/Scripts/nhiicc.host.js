function nhiicc_host() {
    this.baseHttpUrl = 'http://localhost:59001/';
    this.baseHttpsUrl = 'https://localhost:59002/';
	this.wsUri = 'wss://iccert.nhi.gov.tw:7777/echo';
    this.baseHttpApiUrl = this.baseHttpUrl + 'api/';
    this.baseHttpsApiUrl = this.baseHttpsUrl + 'api/';
    this.initEvent = false;
    this.httpStatus = false;
    this.httpsStatus = false;
	this.wssStatus = false;
	
	function GetErrorH_SignMessage(ErrCode) {
		var msg = "";
		ErrCode = ErrCode.replace(",", "");
		switch (ErrCode) {
			case "0000":
				break;
			case "4061":
				msg = '[' + ErrCode + '] 無法連接服務網站';
				break;
			case "7001":
				msg = '[' + ErrCode + '] pcsc環境異常';
				break;
			case "7002":
				msg = '[' + ErrCode + '] 無法存取讀卡機';
				break;
			case "7003":
				msg = '[' + ErrCode + '] 無法存取讀卡機';
				break;
			case "7004":
				msg = '[' + ErrCode + '] 未置入健保卡';
				break;
			case "8001":
				msg = '[' + ErrCode + '] 讀卡異常';
				break;
			case "8002":
				msg = '[' + ErrCode + '] 讀卡異常';
				break;
			case "8003":
				msg = '[' + ErrCode + '] 認卡傳輸異常';
				break;
			case "8004":
				msg = '[' + ErrCode + '] 認卡傳輸異常';
				break;
			case "8005":
				msg = '[' + ErrCode + '] 認卡傳輸異常';
				break;
			case "8006":
				msg = '[' + ErrCode + '] 卡片回傳無法認卡';
				break;
			case "8007":
				msg = '[' + ErrCode + '] 認卡傳輸異常';
				break;
			case "8008":
				msg = '[' + ErrCode + '] 認卡傳輸異常';
				break;
			case "8010":
				msg = '[' + ErrCode + '] 讀取基本資料失敗';
				break;
			case "8011":
				msg = '[' + ErrCode + '] 讀取基本資料失敗';
				break;
			case "8013":
				msg = '[' + ErrCode + '] 無法存取健保卡，請查明讀卡機是否已插好或是否已置入健保卡';
				break;
			case "8201":
				msg = '[' + ErrCode + '] 服務異常';
				break;
			case "8202":
				msg = '[' + ErrCode + '] 服務異常';
				break;
			case "8302":
				msg = '[' + ErrCode + '] PKCS#11異常';
				break;
			case "8303":
				msg = '[' + ErrCode + '] PKCS#11異常';
				break;
			case "8304":
				msg = '[' + ErrCode + '] Session 建立異常';
				break;
			case "8305":
				msg = '[' + ErrCode + '] Session 建立異常';
				break;
			case "8306":
				msg = '[' + ErrCode + '] PKCS#11異常';
				break;
			case "9001":
				msg = '[' + ErrCode + '] 驗簽失敗';
				break;
			case "9002":
				msg = '[' + ErrCode + '] 驗簽失敗';
				break;
			default:
				msg = 'A001元件安裝問題，請下載元件安裝檔執行安裝[' + ErrCode + '] ';
				break;
		  }
		return msg;
	}

    function InnerGetStatus(url, callback, error) {
        var canvas_id = 'nhiicc_canvas_status';
        $('body').append('<canvas id="' + canvas_id + '" style="display:none" width="1024" height="1"></canvas>');
        var c = $('#' + canvas_id);
        var ctx = c[0].getContext('2d');
        var img = new Image;
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            var myImageData = ctx.getImageData(0, 0, 1024, 1).data;
            var width = img.width;
            var r = '';
            for (var i = 0; i < width; i++) {
                var b0 = myImageData[(i * 4) + 0];
                var b1 = myImageData[(i * 4) + 1];
                var b2 = myImageData[(i * 4) + 2];
                var b3 = myImageData[(i * 4) + 3];

                if (b2 !== 0) r += String.fromCharCode(b2);
                if (b1 !== 0) r += String.fromCharCode(b1);
                if (b0 !== 0) r += String.fromCharCode(b0);
            }
            c.remove();
            var response = JSON.parse(r);
            if (callback) callback(response);
        };
        img.onerror = function () {
            if (error) error();
        };
        var d = new Date();
        img.crossOrigin = "Anonymous";
        img.src = url + "GetStatus.bmp?tick=" + d.getTime();
    }
    function InnerGetCardStatus (url, callback, error) {
        var canvas_id = 'nhiicc_canvas_card_status';
        $('body').append('<canvas id="' + canvas_id + '" style="display:none" width="1024" height="1"></canvas>');
        var c = $('#' + canvas_id);
        var ctx = c[0].getContext('2d');
        var img = new Image;
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            var myImageData = ctx.getImageData(0, 0, 1024, 1).data;
            var width = img.width;
            var r = '';
            for (var i = 0; i < width; i++) {
                var b0 = myImageData[(i * 4) + 0];
                var b1 = myImageData[(i * 4) + 1];
                var b2 = myImageData[(i * 4) + 2];
                var b3 = myImageData[(i * 4) + 3];

                if (b2 !== 0) r += String.fromCharCode(b2);
                if (b1 !== 0) r += String.fromCharCode(b1);
                if (b0 !== 0) r += String.fromCharCode(b0);
            }
            c.remove();
            var response = JSON.parse(r);
            if (callback) callback(response);
        };
        img.onerror = function () {
            if (error) error();
        };
        var d = new Date();
        img.crossOrigin = "Anonymous";
        img.src = url + "GetCardStatus.bmp?tick=" + d.getTime();
    }
    function InnerGetVersion (url, callback, error) {
        $.post(url + 'GetVersion', function (data) {
            if (callback) callback(data);
        }).fail(function () {
            if (error) error();
        });
    }
    function InnerGetBasic (url, callback, error) {
        $.post(url + 'GetBasic', function (data) {
            if (callback) callback(data);
        }).fail(function () {
            if (error) error();
        });
    }
    function InnerGetRandom (url, callback, error) {
        $.post(url + 'GetRandom', function (data) {
            if (callback) callback(data);
        }).fail(function () {
            if (error) error();
        });
    }
    function InnerSignHC (url, random, callback, error) {
        var data = { random: random };
        var input = JSON.stringify(data);
        $.post(url + 'SignHC', input).done(function (data) {
            if (callback) callback(data);
        }).fail(function () {
            if (error) error();
        });
    }
    function InnerEncryptPwd (url, password, callback, error) {
        var data = { pwd: password };
        var input = JSON.stringify(data);
        $.post(url + 'EncryptPwd', input).done(function (data) {
            if (callback) callback(data);
        }).fail(function () {
            if (error) error();
        });
    }
    function InnerGetEncryptBasic (url, password, callback, error) {
        var data = { pwd: password };
        var input = JSON.stringify(data);
        $.post(url + 'GetEncryptBasic', input).done(function (data) {
            if (callback) callback(data);
        }).fail(function (err) {
            if (error) error(err);
        });
    }
    function InnerAuthHC (url, password, callback, error) {
        InnerGetVersion(url, function (data1) {
            if (data1.result !== "0000") {
                if (callback) callback(data1);
                return;
            }
            InnerGetRandom(url, function (data2) {
                if (data2.result !== "0000") {
                    if (callback) callback(data2);
                    return;
                }
                InnerGetBasic(url, function (data3) {
                    if (data3.result !== "0000") {
                        if (callback) callback(data3);
                        return;
                    }
                    InnerSignHC(url, data2.random, function (data4) {
                        if (data4.result !== "0000") {
                            if (callback) callback(data4);
                            return;
                        }
                        InnerEncryptPwd(url, password, function (data5) {
                            if (data5.result !== "0000") {
                                if (callback) callback(data5);
                                return;
                            }
                            InnerGetEncryptBasic(url, password, function (data6) {
                                if (data6.result !== "0000") {
                                    if (callback) callback(data6);
                                    return;
                                }
                                var result = $.extend({}, data1, data2, data3, data4, data5, data6);
                                if (callback) callback(result);
                            }, error);
                        }, error);
                    }, error);
                }, error);
            }, error);
        }, error);
    }
    function InnerPopupAuthHC (url, password, callback) {
        var childUrl = url + 'auth.html';
        var ready = false;
        function SendAuthPinStep1(sender, e) {
            var msg = {
                'action': 'send_auth_pin_step1',
                'pin': password
            };
            var sMsg = JSON.stringify(msg);
            sender.postMessage(sMsg, childUrl);
        }

        function RecvAuthPinStep1(sender, e) {
            var msg = {
                'action': 'close'
            };
            var sMsg = JSON.stringify(msg);
            sender.postMessage(sMsg, childUrl);
            if (callback) callback(e);
        }
        if (!this.initEvent) {
            this.initEvent = true;
            $(window).on('message', function (e) {
                var event = e.originalEvent;
                var origin = event.origin;
                //if (origin == cHost) {
                var data = event.data;
                var msg = JSON.parse(data);
                if (msg.action === 'ready') {
                    ready = true;
                    SendAuthPinStep1(event.source, msg);
                } else if (msg.action === 'recv_auth_pin_step1') {
                    RecvAuthPinStep1(event.source, msg);
                }
                //}
            });
        }
        popup = window.open(childUrl, 'auth window', 'height=150,width=150,resizable=no,scrollbars=no,titlebar=no,toolbar=no');
        setTimeout(function () {
            if (popup && !ready) {
                popup.close();
            }
        }, 3000);
    }
	function InnerH_Sign (url, callback, error) {
        InnerGetVersion(url, function (data1) {
            if (data1.result !== "0000") {
                if (error) error(GetErrorH_SignMessage(data1.result));
                return;
            }
            InnerGetRandom(url, function (data2) {
                if (data2.result !== "0000") {
					if (error) error(GetErrorH_SignMessage(data2.result));
                    return;
                }
                InnerGetBasic(url, function (data3) {
                    if (data3.result !== "0000") {
						if (error) error(GetErrorH_SignMessage(data3.result));
                        return;
                    }
                    InnerSignHC(url, data1.version + data2.random, function (data4) {
                        if (data4.result !== "0000") {
                            if (error) error(GetErrorH_SignMessage(data3.result));
                            return;
                        }
						var result = {};
						result.Basic = data3.card_no + "," + data3.as_id + "," + data3.name + "," + data3.birthday + "," + data3.sex + "," + data3.card_termination;
						result.Version = data1.version;
						result.Random = data2.random;
						result.Sign = data4.sign;
                        if (callback) callback(result);
                    }, error);
                }, error);
            }, error);
        }, error);
    }
    // Http
    this.HttpGetStatus = function (callback, error) {
        InnerGetStatus(this.baseHttpApiUrl, callback, error);
    };
    this.HttpGetCardStatus = function (callback, error) {
        InnerGetCardStatus(this.baseHttpApiUrl, callback, error);
    };
    this.HttpGetVersion = function (callback, error) {
        InnerGetVersion(this.baseHttpApiUrl, callback, error);
    };
    this.HttpGetBasic = function (callback, error) {
        InnerGetBasic(this.baseHttpApiUrl, callback, error);
    };
    this.HttpGetRandom = function (callback, error) {
        InnerGetRandom(this.baseHttpApiUrl, callback, error);
    };
    this.HttpSignHC = function (random, callback, error) {
        InnerSignHC(this.baseHttpApiUrl, random, callback, error);
    };
    this.HttpEncryptPwd = function (password, callback, error) {
        InnerEncryptPwd(this.baseHttpApiUrl, password, callback, error);
    };
    this.HttpGetEncryptBasic = function (password, callback, error) {
        InnerGetEncryptBasic(this.baseHttpApiUrl, password, callback, error);
    };
    this.HttpAuthHC = function (password, callback, error) {
        InnerAuthHC(this.baseHttpApiUrl, password, callback, error);
    };
	this.HttpH_Sign = function(callback, error) {
		InnerH_Sign(this.baseHttpApiUrl, callback, error);
	}

    // Https
    this.HttpsGetStatus = function (callback, error) {
        InnerGetStatus(this.baseHttpsApiUrl, callback, error);
    };
    this.HttpsGetCardStatus = function (callback, error) {
        InnerGetCardStatus(this.baseHttpsApiUrl, callback, error);
    };
    this.HttpsGetVersion = function (callback, error) {
        InnerGetVersion(this.baseHttpsApiUrl, callback, error);
    };
    this.HttpsGetBasic = function (callback, error) {
        InnerGetBasic(this.baseHttpsApiUrl, callback, error);
    };
    this.HttpsGetRandom = function (callback, error) {
        InnerGetRandom(this.baseHttpsApiUrl, callback, error);
    };
    this.HttpsSignHC = function (random, callback, error) {
        InnerSignHC(this.baseHttpsApiUrl, random, callback, error);
    };
    this.HttpsEncryptPwd = function (password, callback, error) {
        InnerEncryptPwd(this.baseHttpsApiUrl, password, callback, error);
    };
    this.HttpsGetEncryptBasic = function (password, callback, error) {
        InnerGetEncryptBasic(this.baseHttpsApiUrl, password, callback, error);
    };
    this.HttpsAuthHC = function (password, callback, error) {
        InnerAuthHC(this.baseHttpsApiUrl, password, callback, error);
    };
	this.HttpsH_Sign = function(callback, error) {
		InnerH_Sign(this.baseHttpsApiUrl, callback, error);
	}
    var self = this;
    // Mix
    this.GetStatus = function (callback, error) {
        if (self.httpStatus) {
            self.HttpsGetStatus(callback, error);
        } else {
            self.HttpGetStatus(callback, error);
        }
    };
    this.GetCardStatus = function (callback, error) {
        if (self.httpStatus) {
            self.HttpGetCardStatus(callback, error);
        } else {
            self.HttpsGetCardStatus(callback, error);
        }
    };
    this.GetVersion = function (callback, error) {
        if (self.httpStatus) {
            self.HttpGetVersion(callback, error);
        } else {
            self.HttpsGetVersion(callback, error);
        }
    };
    this.GetBasic = function (callback, error) {
        if (self.httpStatus) {
            self.HttpGetBasic(callback, error);
        } else {
            self.HttpsGetBasic(callback, error);
        }
    };
    this.GetRandom = function (callback, error) {
        if (self.httpStatus) {
            self.HttpGetRandom(callback, error);
        } else {
            self.HttpsGetRandom(callback, error);
        }
    };
    this.SignHC = function (callback, error) {
        if (self.httpStatus) {
            self.HttpSignHC(callback, error);
        } else {
            self.HttpsSignHC(callback, error);
        }
    };
    this.EncryptPwd = function (password, callback, error) {
        if (self.httpStatus) {
            self.HttpEncryptPwd(password, callback, error);
        } else {
            self.HttpsEncryptPwd(password, callback, error);
        }
    };
    this.GetEncryptBasic = function (password, callback, error) {
        if (self.httpStatus) {
            self.HttpGetEncryptBasic(password, callback, error);
        } else {
            self.HttpsGetEncryptBasic(password, callback, error);
        }
    };
    this.AuthHC = function (password, callback, error) {
        if (self.httpStatus) {
            self.HttpAuthHC(password, callback, error);
        } else {
            self.HttpsAuthHC(password, callback, error);
        }
    };
    this.PopupAuthHC = function (password, callback) {
        InnerPopupAuthHC(this.baseHttpUrl, password, callback);
    };
	// web socket
	var websocket = null;
	var socket_success_callback = null;
	var socket_error_callback = null;
	var socket_result = {
		Basic: "",
		Version: "",
		Random: "",
		Sign: ""
	};
	var socket_step = null;
	function onLoadweb() {
		//wsUri = "wss://iccert.nhi.gov.tw:7777/echo";
		wsUri = "wss://localhost:7777/echo";

		websocket = new WebSocket(wsUri);
		websocket.onopen = function (evt) { onOpen(evt) };
		websocket.onclose = function (evt) { onClose(evt) };
		websocket.onmessage = function (evt) { onMessage(evt) };
		websocket.onerror = function (evt) { onError(evt) };
	}

	function onOpen(evt) {
		self.wssStatus = true;
	}

	function onClose(evt) {                   
	}

	function onError(evt) {
		self.wssStatus = false;
	}

    this.H_Sign = function(callback, error) {
		if (self.httpStatus) {
			self.HttpH_Sign(callback, error);
		} else if (self.httpsStatus) {
			self.HttpsH_Sign(callback, error);
		} else if (self.wssStatus) {
			socket_step = "0";
			socket_result = {
				Basic: "",
				Version: "",
				Random: "",
				Sign: ""
			};
			socket_success_callback = callback;
			socket_error_callback = error;
			ws_GetBasic();
		} else {
			if (error) error('請檢查元件是否已正確安裝且啟動');
		}
    }

	function ws_GetBasic() {
		websocket.send("GetBasic");
	}

    function ws_GetRandom() {
		websocket.send("GetRandom");
    }

    function ws_GetVersion() {
        websocket.send("GetVersion");
    }

    function ws_H_Sign() {
        if (socket_result.Version == "" || socket_result.Random == "") {
			if (socket_error_callback) socket_error_callback('讀取H_Sign資料失敗');
        } else {
			websocket.send("H_Sign?Random=" + socket_result.Version + socket_result.Random);
        }
    }
	
	
   
    function StartTimer() {
        if (socket_step == "1") {
            window.setTimeout(ws_GetVersion, 0);
        } else if (socket_step == "2") {
            window.setTimeout(ws_GetRandom, 0);
        } else if (socket_step == "3") {
            window.setTimeout(ws_H_Sign, 0);
        }
    }

    function onMessage(evt) {
		var message = evt.data;
		if (message.substring(0, 9) == 'GetBasic:') {//GetBasic:               
			socket_result.Basic = message.slice("GetBasic:".length);
			if (socket_step == "END") {
                if (socket_success_callback) socket_success_callback(socket_result);
            } else {
                socket_step = "1";
                StartTimer();
            }
        } else if (message.substring(0, 11) == 'GetVersion:') {//GetVersion:                 
            socket_result.Version = message.slice("GetVersion:".length);
            socket_step = "2";
            StartTimer();
        } else if (message.substring(0, 10) == 'GetRandom:') {//GetRandom:          
            socket_result.Random = message.slice("GetRandom:".length);
            socket_step = "3";
            StartTimer();
        } else if (message.substring(0, 7) == 'H_Sign:') {//H_Sign:             
            var sSign = message.slice("H_Sign:".length);
            if (sSign.length == 256) {
                socket_result.Sign = sSign;
				if (socket_success_callback) socket_success_callback(socket_result);
            } else {
				if (socket_error_callback) socket_error_callback(GetErrorH_SignMessage(sSign));
            }
        } else if (message.substring(0, 4) == 'log:') {//log:
            var sLog = "";
            sLog = message.slice("log:".length);
            alert(sLog);
        } else if (message.substring(0, 10) == 'connected:') {//connected:
            var sConnect = "";
            sConnect = message.slice("connected:".length);
            alert(sConnect);
        } else {
			if (socket_error_callback) socket_error_callback(GetErrorH_SignMessage(message));
        }
    }
	
	
	
	
	this.HttpGetVersion(function () {
		self.httpStatus = true;
	}, function () {
		self.httpStatus = false;
	});
	this.HttpsGetVersion(function () {
		self.httpsStatus = true;
	}, function () {
		self.httpsStatus = false;
	});
	
    onLoadweb();
}
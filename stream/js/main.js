(function() {
    var sock = null;
    var heartbeatTimeoutFuture;
    var usersNode;
    var connecting = false;
    var config = {"iceServers": [
//        {"url": "stun:stun.l.google.com:19302"}
        {"url": "stun:video.chatovod.ru:1024"},
        {"url":"turn:video.chatovod.ru:1024", "username": "chatovod", "credential":"chatovod"}
    ]};
    var options = {
        optional: [
            {DtlsSrtpKeyAgreement: true},
            {RtpDataChannels: false}
        ]
    };
    var sdpConstraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        }
    };
    var myStream;
    var connections = {};
    var room = getParameterByName("room") == "" ? "a" : getParameterByName("room");
    /**
     * On document ready
      */
    $(function() {
        usersNode = $("#users");
        $(document).on("click", "i.sound", function(e) {
            e.stopPropagation();
            var video = $(this).parent();
            var isOff = video.hasClass("off");
            if (isOff) {
                //turn on
                video.removeClass("off");
                video.find("video").prop("muted", false);
            } else {
                //turn off
                video.addClass("off");
                video.find("video").prop("muted", true);
            }
        });
        $(document).on("click", "i.mic", function(e) {
            e.stopPropagation();
            var video = $(this).parent();
            if (video.hasClass("active")) {
                var isOff = video.hasClass("mic_off");
                if (isOff) {
                    //turn on
                    video.removeClass("mic_off");
                    myStream.getAudioTracks()[0].enabled = true;
                } else {
                    //turn off
                    video.addClass("mic_off");
                    myStream.getAudioTracks()[0].enabled = false;
                }
            }
        });
        $(document).on("click", "i.vid", function(e) {
            e.stopPropagation();
            var video = $(this).parent();
            if (video.hasClass("active")) {
                var isOff = video.hasClass("vid_off");
                if (isOff) {
                    //turn on
                    video.removeClass("vid_off");
                    myStream.getVideoTracks()[0].enabled = true;
                } else {
                    //turn off
                    video.addClass("vid_off");
                    myStream.getVideoTracks()[0].enabled = false;
                }
            }
        });
        $(document).on("click", ".video", function() {
            var isFull = $(this).hasClass("full");
            $(".video").removeClass("full");
            if (!isFull) {
                $(this).addClass("full");
            }
        });

        initMyCam();
    });

    /**
     * Common functions
     */
    function initMyCam() {
        var myVideo = $("#me").find("video").get(0);
        var constraints = {
            audio: {
                mandatory: [],
                optional: [
                    {googEchoCancellation: true},
                    {googAutoGainControl: true},
                    {googNoiseSuppression: true},
                    {googHighpassFilter: true},
                    {googAudioMirroring: false},
                    {googNoiseSuppression2: true},
                    {googEchoCancellation2: true},
                    {googAutoGainControl2: true},
                    {googDucking: false},
                    {googTypingNoiseDetection: true},
                    {chromeRenderToAssociatedSink: true}
                ]
            },
            video: true
        };
        var successCallback = function(stream) {
            attachMediaStream(myVideo, myStream = stream);
            $("#me").addClass("active");
            usersNode.html("<div class=\"text\">Подключение к серверу...</div>");
            reconnect();
        };

        var errorCallback = function(error) {
            usersNode.html("<div class=\"text\">Не удается подключится к камере. Обновите страницу и разрешите доступ.</div>");
            console.log('navigator.getUserMedia error: ', error);
        };
        navigator.getUserMedia(constraints, successCallback, errorCallback);
    };

    function addVideo(evt, userId) {
        var item = $("<div class=\"video\"><video></video><i class=\"sound\" title=\"Звук\"></i></div>");
        item.attr("id", "video"+userId);
        item.attr("data-user-id", userId);
        var video = item.find("video");
        video.attr("autoplay", "autoplay");
        usersNode.children(".text").remove();
        usersNode.prepend(item);
        attachMediaStream(video.get(0), evt.stream);
    };

    function addUser(userId) {
        var pc = new RTCPeerConnection(config, options);
        connections[userId] = pc;
        pc.addStream(myStream);

        pc.onicecandidate = function (e) {
            // candidate exists in e.candidate
            if (e.candidate == null) { return }
            sock.send("6,"+userId + "," + JSON.stringify(e.candidate));
            //pc.onicecandidate = null;
        };

        // once remote stream arrives, show it in the remote video element
        pc.onaddstream = function(evt) {
            addVideo(evt, userId);
        };

        pc.createOffer(function(offer) {
            pc.setLocalDescription(new RTCSessionDescription(offer), function() {
                // send the offer to a server to be forwarded to the friend you're calling.
                sock.send("3,"+userId+","+JSON.stringify(offer));
            }, error);
        }, error, sdpConstraints);
    };

    function removeUser(userId) {
        var pc = connections[userId];
        if (pc) {
            delete connections[userId];
            var video = $("#video" + userId);
            if (video.length != 0) video.find("video").get(0).pause();
            pc.close();
            video.remove();
            if (usersNode.children().length == 0) usersNode.html("<div class=\"text\">Ожидаем пользователей...</div>");
        }
    };

    function answerOffer(userId, offer) {
        var pc = new RTCPeerConnection(config, options);
        connections[userId] = pc;
        pc.addStream(myStream);

        pc.onicecandidate = function (e) {
            // candidate exists in e.candidate
            if (e.candidate == null) { return }
            sock.send("6,"+userId + "," + JSON.stringify(e.candidate));
            //pc.onicecandidate = null;
        };

        // once remote stream arrives, show it in the remote video element
        pc.onaddstream = function(evt) {
            addVideo(evt, userId);
        };

        pc.setRemoteDescription(new RTCSessionDescription(offer), function() {
            pc.createAnswer(function(answer) {
                pc.setLocalDescription(new RTCSessionDescription(answer), function() {
                    // send the answer to a server to be forwarded back to the caller (you)
                    sock.send("4,"+userId+","+JSON.stringify(answer));
                }, error);
            }, error, sdpConstraints);
        }, error);
    };

    function handleAnswer(userId, answer) {
        var pc = connections[userId];
        if (pc) {
            pc.setRemoteDescription(new RTCSessionDescription(answer), function () {
                //console.log("Done!");
            }, error);
        }
    };

    function handleCandidate(userId, candidateObj) {
        var pc = connections[userId];
        if (pc) {
            var candidate = new RTCIceCandidate(candidateObj);
            pc.addIceCandidate(candidate, function () {
                //console.log("candidate ok");
            }, error);
        }
    };

    function error(evt) {
        console.log("error", evt);
    };

    function reconnect() {
        if (!connecting) {
            addMsg("Подключение к серверу...", "con");
            connecting = true;
        }
        sock = new SockJS('https://video.chatovod.ru/'+encodeURIComponent(room)+'/socket', null, {
            debug: true/*,
            protocols_whitelist: [
                'websocket', 'xdr-streaming', 'xhr-streaming', 'iframe-eventsource', 'iframe-htmlfile', 'xdr-polling',
                'xhr-polling', 'iframe-xhr-polling', 'jsonp-polling'
            ]*/
        });
        sock.onopen = function () {
            connecting = false;
            addMsg("Подключены", "sys");
            resetHeartbeatTimeout();
            usersNode.html("<div class=\"text\">Ожидаем пользователей...</div>");
        };

        sock.onclose = function () {
            cancelHeartbeatTimeout();
            sock = null;
            setTimeout(reconnect, 3000);
        };

        sock.onmessage = function (e) {
            resetHeartbeatTimeout();
            var data = split(e.data,",",2); //3 parts
            var cmd = data[0];
            switch (cmd) {
                case '2':
                    //new user
                    addUser(data[1]);
                    break;
                case '3':
                    //new offer
                    answerOffer(data[1], JSON.parse(data[2]));
                    break;
                case '4':
                    //answer
                    handleAnswer(data[1], JSON.parse(data[2]));
                    break;
                case '5':
                    //leave user
                    removeUser(data[1]);
                    break;
                case '6':
                    //candidate
                    handleCandidate(data[1], JSON.parse(data[2]));
                    break;
            }
        };

        sock.onheartbeat = resetHeartbeatTimeout;
    };

    function resetHeartbeatTimeout() {
        if (heartbeatTimeoutFuture) {
            clearTimeout(heartbeatTimeoutFuture);
        }
        heartbeatTimeoutFuture = setTimeout(heartbeatTimeout, 60000);
    };

    function cancelHeartbeatTimeout() {
        if (heartbeatTimeoutFuture) {
            clearTimeout(heartbeatTimeoutFuture);
            heartbeatTimeoutFuture = null;
        }
    };

    function heartbeatTimeout() {
        addMsg("Потеряна связь с сервером.", "con");
        sock.close();
        heartbeatTimeoutFuture = null;
    };

    function addMsg(text, className) {
        console.log(text);
    };

    function split(str, separator, limit) {
        str = str.split(separator);

        if(str.length > limit) {
            var ret = str.splice(0, limit);
            ret.push(str.join(separator));

            return ret;
        }

        return str;
    };

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    };

})();
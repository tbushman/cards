var functions={parseObj:function(obj){if(!obj)return"";return obj},parseObject:function(obj){if(!obj)return{};return obj},parseBool:function(bool){if(!bool)return false;return bool},parseArr:function(arr){if(!arr)return[];return arr},nothing:function(){return},nullIfEmpty:function(obj){if(!obj||obj===""){return null}return obj},unload:function(){console.log("unloading jitsi api");var self=this;for(var i=0;i<self.localTracks.length;i++){self.localTracks[i].dispose()}self.api.dispose();self.keys.forEach(function(k){self[k]=self.initLocals[k]});self.inprogress=false;self.updateCheck()},leave:function(){var self=this;console.log(self.uid+"leaving");if(self.players.indexOf(self.uid)!==-1){self.players.splice(self.players.indexOf(self.uid),1)}if(self.api){self.api.dispose()}self.updateCheck()},accountGuestlist:function(){var self=this;self.ready=self.isReady()},isReady:function(){var self=this;if(typeof self.guestlist.split==="function"){var guestlist=self.guestlist.split(/\,\s{0,3}/);if(guestlist.indexOf(self.uid)===-1){guestlist.push(self.uid)}var present=self.players.filter(function(player){return guestlist.indexOf(player)!==-1});return present.length===guestlist.length}else{return false}},toggleGuestlist:function(){var self=this;var collapsed=self.guestlistCollapse;self.guestlistCollapse=!collapsed},sendInvites:function(){var self=this;var guestlist=encodeURIComponent(self.guestlist);console.log(guestlist);if(guestlist!==""){$.post("/invite/"+guestlist+"",function(response){localStorage.setItem("__cardgame_guestlist__",decodeURIComponent(guestlist));self.guestlistCollapse=true})}},updateCheck:function(){var self=this;var locals={playerhands:{}};self.keys.forEach(function(k){if(k==="playerhands"){Object.keys(self.playerhands).forEach(function(p){locals[k][p]=self.playerhands[p]})}else{locals[k]=self[k]}});console.log(locals);socket.emit("change state",locals)},handleResize:function(){var self=this;self.wiw=window.innerWidth;self.wih=window.innerHeight;self.getBubbleSize()},handleReset:function(){var self=this;self.cards=[];self.getCards()},getBubbleSize:function(){var self=this;var initsize=480;var targetWidth=!self.res?self.wiw*.45:self.wiw;var diffW=targetWidth-initsize;var perW=diffW/targetWidth;var scaleW=1+perW;var targetHeight=!self.res?self.wih:self.wih*.3;var diffH=targetHeight-initsize;var perH=diffH/targetHeight;var scaleH=1+perH;self.bubblesize="scale("+scaleW+", "+scaleH+")";self.framesize=[targetWidth,targetHeight-8]},getPlayers:function(){var self=this;if(!self.uid){if(window.location.href.split("invite/")[1]){self.uid=decodeURIComponent(window.location.href.split("invite/")[1])}else{return self.openModal()}}if(self.players.indexOf(self.uid)===-1){socket.emit("new player",self.uid)}},getCards:function(){var self=this;var deck=new Array(52);var deck1=deck.fill(undefined).map(function(v,j){var suit="";var court=null;var i=j;if(i<=12){court=i+1;if(i===10){court="j"}else if(i===11){court="q"}else if(i===12){court="k"}suit="club"}if(i>12&&i<=25){court=i-12;if(i===23){court="j"}else if(i===24){court="q"}else if(i===25){court="k"}suit="diamond"}if(i>25&&i<=38){court=i-25;if(i===36){court="j"}else if(i===37){court="q"}else if(i===38){court="k"}suit="heart"}if(i>38){court=i-38;if(i===49){court="j"}else if(i===50){court="q"}else if(i===51){court="k"}suit="spade"}if(court){var card=suit+court;return card}});var deckb=deck1;var deckc=deck1;var jokera=["jokerb","jokerr"];var jokerb=["jokerb","jokerr"];var jokerc=["jokerb","jokerr"];var cards=self.shuffle(deck1.concat(deckb,deckc,jokera,jokerb,jokerc));self.cards=cards;self.updateCheck()},deal:function(){var self=this;if(!self.players||self.players.length===0){self.initDeal()}for(var i=0;i<6;i++){self.players.forEach(function(player){if(!self.playerhands[player]||!Array.isArray(self.playerhands[player])){self.playerhands[player]=[]}self.playerhands[player][i]=self.cards[self.cards.length-1];self.cards.pop()})}self.updateCheck()},initDeal:function(){var self=this;self.deal()},getUid:function(){var self=this;if(!self.uid){if(window.location.href.split("invite/")[1]){self.uid=decodeURIComponent(window.location.href.split("invite/")[1])}else{return self.openModal()}}},startPlay:function(name){var self=this;if(!self.uid){if(window.location.href.split("invite/")[1]){self.uid=decodeURIComponent(window.location.href.split("invite/")[1])}else if(name){localStorage.setItem("__cardgame_uid__",name);self.uid=name}else{return self.openModal()}}var domain="bli.sh";var options={roomName:self.appTitle,width:(!self.framesize?!self.res?self.wWidth*.66:self.wWidth*.86:self.framesize[0])+"px",height:(!self.framesize?!self.res?self.wWidth*.66*.72:self.wWidth*.72*.95:self.framesize[1])+"px",parentNode:document.getElementById("meeting"),userInfo:{email:self.uid,displayName:self.uid}};self.api=new JitsiMeetExternalAPI(domain,options);self.api.addEventListener("participantJoined",function(response){console.log("participantJoined");console.log(response)});var iframe=document.getElementById("jitsiConferenceFrame");setTimeout(function(){iframe.style.position="absolute";iframe.style.top="0";iframe.style.left="0"},1e3);if(!self.inprogress){self.inprogress=true}else{}self.getPlayers()},tee:function(card,k){var self=this;if(self.whoseTurn===self.uid){if(self.teed.index){self.untee(self.teed.card,self.teed.index)}self.teed={card:card,index:k}}},untee:function(card,k){var self=this;if(self.whoseTurn===self.uid){self.playerhands[self.uid][self.teed.index]=self.teed.card;self.teed.card=null;self.teed.index=null}},draw:function(){var self=this;if(self.whoseTurn===self.uid){self.playerhands[self.whoseTurn].push(self.cards[self.cards.length-1]);self.cards.pop();setTimeout(function(){if(self.playerhands[self.whoseTurn].length===6){var nextIndex=!self.players[self.turnIndex+1]?0:self.turnIndex+1;var whoseTurn=!self.players[nextIndex]?self.uid:self.players[nextIndex];self.teed.card=null;self.teed.index=null;self.whoseTurn=whoseTurn;self.turnIndex=nextIndex;self.updateCheck()}},200)}},discardActive:function(){var self=this;if(self.whoseTurn===self.uid){if(self.teed&&self.teed!==""){self.discard.push(self.teed.card);self.playerhands[self.uid].splice(self.teed.index,1);self.teed={card:null,index:null};self.updateCheck()}}},openModal:function(){var self=this;self.modal=true},localStorageName:function(){var self=this;var nameInput=document.getElementById("uid");var name=nameInput.value;localStorage.setItem("__cardgame_uid__",name);self.uid=name;self.modal=false;self.getPlayers();return self.startPlay(name)},shuffle:function(array){var m=array.length,t,i;while(m){i=Math.floor(Math.random()*m--);t=array[m];array[m]=array[i];array[i]=t}return array}};
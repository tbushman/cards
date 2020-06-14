var functions = {
	// return {
		parseObj: function(obj) {
			if (!obj) return '';
			return obj;
		},
		parseObject: function(obj) {
			if (!obj) return {};
			return obj;
		},
		parseBool: function(bool) {
			if (!bool) return false;
			return bool;
		},
		parseArr: function(arr) {
			if (!arr) return []
			return arr;
		},
		nothing: function() {
			return;
		},
		unload: function() {
			console.log('unloading jitsi api')
			var self = this;
			for (var i = 0; i < self.localTracks.length; i++) {
				self.localTracks[i].dispose();
			}
			// self.room.leave();
			// self.connection.disconnect();
			self.api.dispose();
			self.inprogress = false;
			self.players.forEach(function(player){
				$.post('/playerleave/'+encodeURIComponent(player), function(response) {
					console.log(response)
				})
			})
			self.players = [];
			self.updateCheck()
		},
		leave: function() {
			var self = this;
			console.log(self.uid + 'leaving')
			if (self.players.indexOf(self.uid) !== -1) {
				self.players.splice(self.players.indexOf(self.uid), 1);
				$.post('/playerleave/'+encodeURIComponent(self.uid), function(response) {
					console.log(response)
				})
			}
			if (self.api) {
				self.api.dispose();
			}
			self.updateCheck()
		},
		accountGuestlist: function() {
			var self = this;
			
			if (typeof self.guestlist.split === 'function') {
					self.ready = self.isReady()
					
			} else {
				self.guestlist = self.players.join(', ')
			}
		},
		isReady: function() {
			var self = this;
			if (typeof self.guestlist.split === 'function') {
				var guestlist = self.guestlist.split(/\,\s{0,3}/);
				var present = self.players.filter(function(player){
					return guestlist.indexOf(player) !== -1 
				});
				return (present.length === guestlist.length)
			} else {
				return false
			}
			
		},
		toggleGuestlist: function() {
			var self = this;
			var collapsed = self.guestlistCollapse;
			self.guestlistCollapse = !collapsed;
		},
		sendInvites: function() {
			var self = this;
			var guestlist = encodeURIComponent(self.guestlist);
			console.log(guestlist)
			if (guestlist !== '') {
				$.post('/invite/'+guestlist+'', function(response){
					localStorage.setItem('__cardgame_guestlist__', decodeURIComponent(guestlist))
					self.guestlistCollapse = true
				})
			}
		},
		startLongPolling: function() {
			var self = this;
			if (self.longinterval && self.longinterval !== '') {
				clearInterval(self.longinterval)
			}
			
			// setTimeout(function(){
				self.longinterval = setInterval(function(){
					if (self.whoseTurn === self.uid) {
						self.updateCheck()
					}
				}, 10000)
			// },10000)

			
		},
		startPlayersPolling: function() {
			var self = this;
			self.interval = setInterval(function(){
				self.accountGuestlist();
				self.getPlayers();
				self.runCheck();
				self.ready = self.isReady()
			}, 2000);
		},
		updateCheck: function(wt, ti) {
			var self = this;
			var whoseTurn = (!wt ? (self.whoseTurn && self.whoseTurn !== '' ? self.whoseTurn : null) : wt);
			var turnIndex = (!ti ? (self.turnIndex && self.turnIndex !== '' ? self.turnIndex : null) : ti);
			// if (untee) {
			// 	var nextIndex = (!self.players[self.turnIndex+1] ? 0 : (self.turnIndex + 1))
			// 	self.turnIndex = nextIndex;
			// 	self.whoseTurn = (!self.players[nextIndex] ? self.uid : self.players[nextIndex]);
			// 	setTimeout(function(){
			// 		return self.updateCheck()
			// 	}, 200);
			// }
			// if (!whoseTurn) {
			// 	whoseTurn = self.whoseTurn;
			// } 
			// if (!turnIndex) {
			// 	turnIndex = self.turnIndex;
			// }
			var playerhands = {}
			Object.keys(self.playerhands).forEach(function(uid){
				playerhands[uid] = self.playerhands[uid]
			})//JSON.parse(JSON.stringify(self.playerhands))
			//- console.log(playerhands)
			var locals = (!whoseTurn || !turnIndex ? 
				{
					busy: self.busy,
					players: self.players,
					info: self.info,
					cards: self.cards,
					discard: self.discard,
					inprogress: self.inprogress,
					playerhands: playerhands,
					teed: self.teed
				}
			:
				{
					busy: self.busy,
					players: self.players,
					info: self.info,
					cards: self.cards,
					discard: self.discard,
					inprogress: self.inprogress,
					playerhands: playerhands,
					turnIndex: turnIndex,
					whoseTurn: whoseTurn,
					teed: self.teed
				}
			) 
			console.log(locals)
			$.post('/check/'+encodeURIComponent(JSON.stringify(locals)), function(result) {
				//- console.log(result)
				if (result && result !== undefined) {
					var keys = Object.keys(result);
					keys.forEach(function(k){
						if (k === 'playerhands') {
							Object.keys(result[k]).forEach(function(p){
								self.playerhands[p] = result[k][p]
							})
						} else {
							self[k] = result[k]
							//- console.log(self[k], k)
						}
					});
					if (whoseTurn) {
						setTimeout(function(){
							self.teed = null;
						}, 1000);
					}
				} else {
					self.busy = false;
				}
			})
		},
		runCheck: function() {
			var self = this;
			if (!self.teed || self.teed === '') {
				$.post('/check/'+null, function(result) {
					//- console.log(result)
					if (result && result !== undefined) {
						var keys = Object.keys(result);
						keys.forEach(function(k){
							if (k === 'playerhands') {
								Object.keys(result[k]).forEach(function(p){
									self.playerhands[p] = result[k][p]
								})
							} else {
								self[k] = result[k]
								//- console.log(self[k], k)
							}
						})
					} else {
						self.busy = false;
					}
					
					if (!self.guestlist || self.guestlist === '' || self.guestlist === self.uid) {
						if (localStorage.getItem('__cardgame_guestlist__')) {
							self.guestlist = localStorage.getItem('__cardgame_guestlist__')
						} 
						// else if (self.uid && self.players.indexOf(self.uid) !== -1) {
						// 	self.guestlist = self.players.join(', ')
						// }
					}
					// self.updateCheck();
				})
			}
		},
		handleResize: function() {
			var self = this;
			self.wiw = window.innerWidth;
			self.wih = window.innerHeight;
			self.getBubbleSize();
		},
		handleReset: function() {
			var self = this;
			self.cards = [];
			self.getCards();
		},
		getBubbleSize: function() {
			var self = this;
			var initsize = 480;
			var targetWidth = (!self.res ? (self.wiw * 0.45) : self.wiw);
			var diffW = targetWidth - initsize;
			var perW = diffW / targetWidth;
			var scaleW = 1 + perW;
			var targetHeight = (!self.res ? self.wih : (self.wih * 0.3));
			var diffH = targetHeight - initsize;
			var perH = diffH / targetHeight;
			var scaleH = 1 + perH;
			self.bubblesize = 'scale('+scaleW+', '+scaleH+')';
			self.framesize = [targetWidth,targetHeight-8]
		},
		getPlayers: function() {
			var self = this;
			if (!self.uid) {
				if (window.location.href.split('invite/')[1]) {
					self.uid = decodeURIComponent(window.location.href.split('invite/')[1])
				} else {
					return self.openModal()
				}
			}
			$.post('/player/'+self.uid+'', function(response){
				//- console.log(response)
				self.players = response;

			})
		},
		getCards: function(){
			var self = this;
			var deck = new Array(52);
			var deck1 = deck.fill(undefined).map(function(v,j){
				var suit = '';
				var court = null;
				var i = j;
				if (i <= 12) {
					court = i+1;
					if (i === 10) {
						court = 'j'
					} else if (i === 11) {
						court = 'q'
					} else if (i === 12) {
						court = 'k'
					}
					suit = 'club';
				}
				if (i > 12 && i <= 25) {
					court = i - 12;
					if (i === 23) {
						court = 'j'
					} else if (i === 24) {
						court = 'q'
					} else if (i === 25) {
						court = 'k'
					}
					suit = 'diamond';
				}
				if (i > 25 && i <= 38) {
					court = i - 25;
					if (i === 36) {
						court = 'j'
					} else if (i === 37) {
						court = 'q'
					} else if (i === 38) {
						court = 'k'
					}
					suit = 'heart';
				}
				if (i > 38) {
					court = i - 38;
					if (i === 49) {
						court = 'j'
					} else if (i === 50) {
						court = 'q'
					} else if (i === 51) {
						court = 'k'
					}
					suit = 'spade';
				}
				if (court) {
					var card = suit + court;
					return card
				}
			})
			var deckb = deck1;
			var deckc = deck1;
			var jokera = ['jokerb', 'jokerr'];
			var jokerb = ['jokerb', 'jokerr'];
			var jokerc = ['jokerb', 'jokerr'];
			
			var cards = self.shuffle(deck1.concat(deckb, deckc, jokera, jokerb, jokerc));
			self.cards = cards;
			//- console.log(cards)
			$.post('/save/'+encodeURIComponent(JSON.stringify(cards))+'', function(response){
				self.cards = response;
				self.updateCheck()
			});
		},
		deal: function() {
			var self = this;
			if (!self.players || self.players.length === 0) {
				self.initDeal()
			}
			for (var i = 0; i < 6; i++) {
				self.players.forEach(function(player){
					if (!self.playerhands[player] || !Array.isArray(self.playerhands[player])) {
						self.playerhands[player] = [];
					}
					self.playerhands[player][i] = self.cards[self.cards.length-1];
					self.cards.pop();
				})
			}
			$.post('/playerhands/'+encodeURIComponent(JSON.stringify(self.playerhands)), function(result){
				$.post('/save/'+encodeURIComponent(JSON.stringify(self.cards)), function(res){
					if (!self.whoseTurn || self.whoseTurn === '') {
						self.whoseTurn = self.uid;
					}
					self.updateCheck();
				})
			})

		},
		initDeal: function() {
			var self = this;
			if (!self.players || self.players.length === 0 || self.players.indexOf(self.uid) === -1) {
				
				self.getPlayers();
				setTimeout(function(){
					self.deal();
				},1000)
			} else {
				self.deal()
			}
		},
		getUid: function() {
			var self = this;
			if (!self.uid) {
				if (window.location.href.split('invite/')[1]) {
					self.uid = decodeURIComponent(window.location.href.split('invite/')[1])
				} else {
					return self.openModal()
				}
			}
		},
		startPlay: function(name){
			var self = this;
			//- console.log(e)
			if (!self.uid) {
				if (window.location.href.split('invite/')[1]) {
					self.uid = decodeURIComponent(window.location.href.split('invite/')[1])
				} else if (name) {
					localStorage.setItem('__cardgame_uid__', name);
					self.uid = name;
				} else {
					return self.openModal()
				}
			}
			var domain = 'bli.sh';
			var options = {
				roomName: self.appTitle,
				width: (!self.framesize ? (!self.res ? (self.wWidth * 0.66) : (self.wWidth*0.86)) : self.framesize[0]) +'px',
				height: (!self.framesize ? (!self.res ? ((self.wWidth * 0.66) * 0.72) : ((self.wWidth * 0.72) * 0.95)) : self.framesize[1])+'px',
				parentNode: document.getElementById('meeting'),
				invitees: self.guestlist.split(/\,\s{0,3}/).map(function(guest){return {email:guest}}),
				userInfo: { email: self.uid, displayName: self.uid }
				// noSSL: false
			};
			self.api = new JitsiMeetExternalAPI(domain, options);
			self.api.addEventListener('participantJoined', function(response) {
				console.log('participantJoined')
				console.log(response)
			})

			var iframe = document.getElementById('jitsiConferenceFrame')
			setTimeout(function(){
				iframe.style.position = 'absolute';
				iframe.style.top = '0'
				iframe.style.left = '0'
			}, 1000);
			
			if (!self.inprogress) {
				$.post('/inprogress/true', function(result){
					self.inprogress = result
				})
			} else {
				
			}
			// if (!self.whoseTurn || self.whoseTurn === '') {
			// 	// self.whoseTurn = self.uid;
			// 	self.updateCheck();
			// }
			self.runCheck()
			// self.whoseTurn = (!self.players[self.turnIndex] ? self.uid : self.players[self.turnIndex])
			//- setTimeout(function(){
			//- 	self.api.addEventListener('passwordRequired', () => {
			//- 		$.post('/env', function(result){
			//- 			self.api.executeCommand('password', result);
			//- 		})
			//- 	});
			//- }, 2000)

			self.startPlayersPolling()
		},
		tee: function(card, k) {
			var self = this;
			if (self.whoseTurn === self.uid) {
				// var isTeed = self.teed
				// // .filter(function(t){
				// // 	return t.card === card & t.index === k
				// // })
				// [0]
				if (self.teed) {
					self.untee(self.teed.card, self.teed.index);
				}
				self.teed =
				// .push(
					{
						card: card,
						index: k
					}
				// )
			}
		},
		untee: function(card, k) {
			var self = this;
			if (self.whoseTurn === self.uid) {
				// if (self.unteed && self.unteed.length > 0) {
				// 
				// }
				// var tIndex = -1
				// var teed = self.teed.filter(function(t,i){
				// 	if (t.card === card && t.index === k) {
				// 		tIndex = i;
				// 	}
				// 	return t.card === card && t.index === k
				// })[0];
				// if (tIndex > -1) {
					self.playerhands[self.uid][self.teed.index] = self.teed.card;
					self.teed = null;//.splice(tIndex, 1);
				// }
			}
		},
		draw: function() {
			var self = this;
			if (self.whoseTurn === self.uid) {
				self.playerhands[self.whoseTurn].push(self.cards[self.cards.length - 1]);
				self.cards.pop();
				setTimeout(function(){
					if (self.playerhands[self.whoseTurn].length === 6) {
						var nextIndex = (!self.players[self.turnIndex+1] ? 0 : (self.turnIndex + 1))
						// self.turnIndex = nextIndex;
						// self.whoseTurn = (!self.players[nextIndex] ? self.uid : self.players[nextIndex]);
						var whoseTurn = (!self.players[nextIndex] ? self.uid : self.players[nextIndex]);
						setTimeout(function(){
							self.updateCheck(whoseTurn, nextIndex);
						}, 500)
					}
				},200)
			}
		},
		discardActive: function() {
			var self = this;
			if (self.whoseTurn === self.uid) {
				if (self.teed && self.teed !== '') {
					// for (var i in self.teed) {
					// 	self.discard.push(self.teed[i].card);
					// 	self.playerhands[self.uid].splice(self.teed[i].index, 1)
					// }
					self.discard.push(self.teed.card);
					self.playerhands[self.uid].splice(self.teed.index, 1)
					self.updateCheck()
				}
			}
		},
		nextPlay: function(uid) {
			var self = this;
			var el = document.getElementById('card');
			var val = (!el ? null : el.value);
			if (!val) return;
			$.post('/play/'+self.uid+'/'+val+'', function(err, result) {
				if (err) {
					console.log(err);
					return;
				}
				$.post('/notbusy?q='+self.uid+'', function(err, result) {
					if (err) {
						console.log(err);
						return;
					}
				})
			})
			
		},
		openModal: function() {
			var self = this;
			self.modal = true;
		},
		localStorageName: function() {
			var self = this;
			var nameInput = document.getElementById('uid');
			var name = 
			//- encodeURIComponent(
				nameInput.value
			//- );
			localStorage.setItem('__cardgame_uid__', name);
			self.uid = name;
			self.modal = false;
			if (!self.players || self.players.length === 0) {
				self.getPlayers();
			}
			return self.startPlay(name)
		},
		//https://bost.ocks.org/mike/shuffle/
		shuffle: function(array) {
			var m = array.length, t, i;

			// While there remain elements to shuffle…
			while (m) {

				// Pick a remaining element…
				i = Math.floor(Math.random() * m--);

				// And swap it with the current element.
				t = array[m];
				array[m] = array[i];
				array[i] = t;
			}

			return array;
		}

	// } 
} 
// module.exports = functions;
function dataObj(self,info,players,playerhands,busy,appTitle,cards,discard,lStorage,inprogress){var localStorageVar=!lStorage?localStorage:lStorage;return{res:window.innerWidth<600,api:null,info:info===""?appTitle:info,players:players,playerhands:playerhands,busy:busy,hov:"",timeout:"",interval:"",appTitle:appTitle,wiw:window.innerWidth,wih:window.innerHeight,bubblesize:null,modal:false,suits:["heart","club","diamond","spade"],cards:cards,decka:[],deckb:[],deckc:[],discard:discard,connection:null,room:null,localTracks:[],remoteTracks:{},isVideo:false,isJoined:false,isFirefox:!navigator?true:navigator.userAgent.includes("Firefox"),isSafari:/constructor/i.test(window.HTMLElement)||function(p){return p.toString()==="[object SafariRemoteNotification]"}(!window["safari"]||typeof safari!=="undefined"&&safari.pushNotification),user:"",hand:[],uid:!localStorageVar.getItem("__cardgame_uid__")?null:localStorageVar.getItem("__cardgame_uid__"),whoseTurn:"",turnIndex:0,teed:null,inprogress:inprogress,invite:[],guestlist:!localStorageVar.getItem("__cardgame_guestlist__")?[localStorageVar.getItem("__cardgame_uid__")]:localStorageVar.getItem("__cardgame_guestlist__"),guestlistCollapse:true,ready:false}}
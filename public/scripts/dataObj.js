function dataObj(self,appTitle){return{res:window.innerWidth<600,api:null,info:appTitle,players:[],playerhands:{},busy:false,hov:"",timeout:"",interval:"",longinterval:"",appTitle:appTitle,wiw:window.innerWidth,wih:window.innerHeight,bubblesize:null,modal:false,suits:["heart","club","diamond","spade"],cards:[],decka:[],deckb:[],deckc:[],discard:[],connection:null,room:null,localTracks:[],remoteTracks:{},isVideo:false,isJoined:false,isFirefox:!navigator?true:navigator.userAgent.includes("Firefox"),isSafari:/constructor/i.test(window.HTMLElement)||function(p){return p.toString()==="[object SafariRemoteNotification]"}(!window["safari"]||typeof safari!=="undefined"&&safari.pushNotification),user:"",hand:[],uid:!localStorage.getItem("__cardgame_uid__")?null:localStorage.getItem("__cardgame_uid__"),whoseTurn:"",turnIndex:0,teed:{card:null,index:null},inprogress:false,invite:[],guestlist:!localStorage.getItem("__cardgame_guestlist__")?"":localStorage.getItem("__cardgame_guestlist__"),guestlistCollapse:true,ready:false,keys:["busy","players","playerhands","cards","discard","info","inprogress","teed","whoseTurn","turnIndex","guestlist"],initLocals:{busy:false,players:[],playerhands:{},cards:[],discard:[],info:"",inprogress:false,teed:{card:null,index:null},whoseTurn:"",turnIndex:0,guestlist:!localStorage.getItem("__cardgame_guestlist__")?"":localStorage.getItem("__cardgame_guestlist__")}}}
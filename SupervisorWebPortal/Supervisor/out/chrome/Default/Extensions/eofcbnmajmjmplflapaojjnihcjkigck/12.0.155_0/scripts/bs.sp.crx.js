/*******************************************************************************
 *  avast! browsers extensions
 *  (c) 2012-2014 Avast Corp.
 *
 *******************************************************************************
 *
 *  Background Browser Specific - Core Chrome Extensions functionality
 *
 ******************************************************************************/

(function (_) {


    var bal = null; //AvastWRC.bal instance - browser agnostic

    var hostInTab = [];
    var scriptInTab = [];

    function hashCode(str) {
        var hash = 0;
        if (str.length === 0) return hash;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * User has change from tab to tab or updated an url in the tab
     *
     * @param  {String} url    Site url loaded into the tab
     * @param  {Object} tab    Tab object reference
     * @param  {String} change Status of the tab (loading or undefined)
     * @return {void}
     */
    function urlInfoChange(url, tab, change, tabUpdated) {
        if (AvastWRC.CONFIG.ENABLE_WEBREP_CONTROL) {
            var urlDetails = [url];

            if (tab.id) {
                urlDetails = {
                    url: url,
                    referer: AvastWRC.TabReqCache.get(tab.id, 'referer'),
                    tabNum: tab.id,
                    windowNum: tab.windowId,
                    reqServices: bal.reqUrlInfoServices,
                    tabUpdated: tabUpdated,
                    originHash: hashCode(url + tab.id + tab.windowId),
                    origin: AvastWRC.TabReqCache.get(tab.id, 'origin'),
                    customKeyValue: AvastWRC.Queue.get('pageTitle')
                };
            }

            // perform urlinfo
            AvastWRC.get(urlDetails, function (res) {
                AvastWRC.bal.emitEvent('urlInfo.response', url, res[0], tab, tabUpdated);
            });
        }
        if (tabUpdated && AvastWRC.bal.DNT && AvastWRC.bal.DNT.initTab) {
            AvastWRC.bal.DNT.initTab(tab.id);
        }
    }


    /**
     * User updates URL  in the browser (clicking a link, etc.) Question: why is it also triggered for unloaded tabs
     *
     * @param  {Number} tabId      Tab Identification
     * @param  {Object} changeInfo state of loading {status : "loading | complete", url: "http://..."}  - url property appears only with status == "loading"
     * @param  {Object} tab        Tab properties
     * @return {void}
     */
    function onTabUpdated(tabId, changeInfo, tab) {
    	AvastWRC.bs.tabExists.call(this, tabId, function() {
	        // ignore unsuported tab urls like chrome://, about: and chrome.google.com/webstore - these are banned by google.
	        // and disable the browser extension for those tabs
	        if (!AvastWRC.bs.checkUrl(tab.url)) {	            
	            chrome.browserAction.disable(tabId);
	            return;
	        }
	
	        //enable the browser extension
	        chrome.browserAction.enable(tabId);
	
	        var host = bal.getHostFromUrl(tab.url);
	
	        if (changeInfo.status === 'loading') {
	            urlInfoChange(tab.url, tab, changeInfo.status, true);
	            if (host) {
	                delete scriptInTab[tab.id];
	            }
	        } else if (changeInfo.status === 'complete') {
	            if (hostInTab[tabId] === undefined) {
	                urlInfoChange(tab.url, tab, changeInfo.status, true);
	            }
	            AvastWRC.bal.emitEvent('page.complete', tabId, tab, tab.url);
	        }
	        if (host) {
	            hostInTab[tabId] = host;
	        }
    	});
    }

    /**
     * User changes tab focus
     *
     * @param  {Object} tab        Tab object
     * @param  {Object} changeInfo [description]
     * @return {void}
     */
    function onSelectionChanged(tabId, changeInfo) {
    	AvastWRC.bs.tabExists.call(this, tabId, function() {
	        chrome.tabs.get(tabId, function (tab) {
	            // ignore unsuported tab urls like chrome://, about: and chrome.google.com/webstore - these are banned by google.

	            if (!AvastWRC.bs.checkUrl(tab.url)) {	                
	                chrome.browserAction.disable(tabId);
	                return;
	            }
	            //enable the browser extension
                chrome.browserAction.enable(tabId);
	
	            urlInfoChange(tab.url, tab, changeInfo.status, false);
	        });
    	});
    }

    function onActivated(activeInfo, changeInfo) {
        
    	AvastWRC.bs.tabExists.call(this, activeInfo.tabId, function() {
	        chrome.tabs.get(activeInfo.tabId, function (tab) {
	            // ignore unsuported tab urls like chrome://, about: and chrome.google.com/webstore - these are banned by google.	            
	            if (!AvastWRC.bs.checkUrl(tab.url)) {	                
	                chrome.browserAction.disable(activeInfo.tabId);
	                return;
	            }
	            //enable the browser extension
	            chrome.browserAction.enable(activeInfo.tabId);
	
	            if (typeof changeInfo == "undefined") {
	                changeInfo = {};
	                changeInfo.status = "complete";
	            }
	            urlInfoChange(tab.url, tab, changeInfo.status, false);
	        });
    	});
    }

    function onRedirect(info) {
    	AvastWRC.bs.tabExists.call(this, info.tabId, function(){
	        chrome.tabs.get(info.tabId, function (tab) {
	            // ignore unsuported tab urls like chrome://, about: and chrome.google.com/webstore - these are banned by google.	            
	            if (!AvastWRC.bs.checkUrl(tab.url)) {	                
	                chrome.browserAction.disable(info.tabId);
	                return;
	            }
	            //enable the browser extension
	            chrome.browserAction.enable(info.tabId);
	
	            console.log(info.statusCode + " REDIRECT from " + info.url + " to " + info.redirectUrl);
	
	            urlInfoChange(info.url, tab, null, AvastWRC.gpb.All.EventType.SERVER_REDIRECT);
	        });
    	});
    }

    function onCommitted(details) {
    	AvastWRC.bs.tabExists.call(this, details.tabId, function(){
	        chrome.tabs.get(details.tabId, function (tab) {
	            // ignore unsuported tab urls like chrome://, about: and chrome.google.com/webstore - these are banned by google.
	            
	            if (!AvastWRC.bs.checkUrl(tab.url)) {	                
	                chrome.browserAction.disable(details.tabId);
	                return;
	            }
	            //enable the browser extension	            
	            chrome.browserAction.enable(details.tabId);	            
	
	            if (details.transitionType !== undefined && details.transitionType !== "auto_subframe") {
	
	                var origin = {
	                    url: details.url,
	                    windowNum: tab.windowId,
	                    tabNum: details.tabId,
	                    origin: AvastWRC.bs.getOrigin(details.transitionType, details.transitionQualifiers),
	                    hash: hashCode(details.url + details.tabId + tab.windowId)
	                };
	
	                console.log("onCommitted() hash:" + origin.hash + " origin:" + origin.origin + " url:" + origin.url);
	                AvastWRC.TabReqCache.set(details.tabId, 'origin', origin);
	            }
	
	        });
    	});
    }
    

    /**
     * Forwards all the messages to the browser agnostic core
     */
    function messageHub(request, sender, reply) {
        bal.commonMessageHub(request.message, request, sender.tab);
    }

    /**
     * Injects all the needed scripts to a tab and sends a message
     */
    function accessContent(tab, data) {
        if (scriptInTab[tab.id] === undefined) {
            scriptInTab[tab.id] = true;
            var options = {
                tab: tab,
                callback: function () { AvastWRC.bs.messageTab(tab, data); }
            };
            _.extend(options, AvastWRC.bal.getInjectLibs());

            if (AvastWRC.bs.ciuvoASdetector && AvastWRC.bs.ciuvoASdetector.isAffiliateSource(tab.id, true)) {
                console.log("afsrc=1 detected, standing down");
            } else {
                AvastWRC.bs.inject(options);
            }

        }
        else {
            AvastWRC.bs.messageTab(tab, data);
        }
    }


    /*****************************************************************************
     * bs - override the common browser function with ext. specific
     ****************************************************************************/
    _.extend(AvastWRC.bs,
        {
            accessContent: accessContent,

            /**
             * Get host of the tab.
             */
            getHostInTab: function (tabId) {
                return hostInTab[tabId];
            },

            /**
             * Set host of the tab.
             */
            setHostInTab: function (tabId, host) {
                hostInTab[tabId] = host;
            }

        });

    /*****************************************************************************
     * bs.aos - browser specific AOS functionality
     ****************************************************************************/
    AvastWRC.bs.core = AvastWRC.bs.core || {};
    _.extend(AvastWRC.bs.core, // Browser specific
        {
            /**
             * Function called on BAL initialization to initialize the module.
             */
            init: function (balInst) {
                bal = balInst;

                chrome.tabs.onUpdated.addListener(onTabUpdated);
                chrome.tabs.onActivated.addListener(onActivated);

                chrome.tabs.onRemoved.addListener(AvastWRC.onTabRemoved);

                chrome.webNavigation.onCommitted.addListener(onCommitted);

                // chrome.webNavigation might also be an option, but it has a bug that affects google search result page: https://bugs.chromium.org/p/chromium/issues/detail?id=115138
                chrome.webRequest.onBeforeRedirect.addListener(onRedirect, { urls: ["http://*/*", "https://*/*"], types: ["main_frame"] });

                chrome.runtime.onMessage.addListener(messageHub);

                chrome.webRequest.onSendHeaders.addListener(
                    AvastWRC.onSendHeaders,
                    { urls: ['http://*/*', 'https://*/*'] },
                    ['requestHeaders']
                );
            },
            /**
             * Called after initialization to kick some functionality on start.
             */
            // afterInit: function () {
            //   AvastWRC.bal.checkPreviousVersion(AvastWRC.CONFIG.CALLERID);
            // },

            /* Register SafePrice Event handlers */
            registerModuleListeners: function (ee) {

            }


        }); // AvastWRC.bs.aos

    AvastWRC.bal.registerModule(AvastWRC.bs.core);
    /*
  if (!AvastWRC.getStorage("landingPageShown")) {
      AvastWRC.bal.openLandingPageTab();
  }
  */
}).call(this, _);
/*******************************************************************************
 *  Background Browser Specific - SafePrice Chrome Extensions functionality
 ******************************************************************************/

(function(_) {
  
  AvastWRC.bs.SP = AvastWRC.bs.SP || {};
  _.extend(AvastWRC.bs.SP, // Browser specific
  {
    /**
     * Function called on BAL initialization to initialize the module.
     */
    init: function (balInst) {
      balInst.modifyInjectLibs( function(injectLibs) {
          injectLibs.libs.push('common/libs/csl.parser.js'); // add Ciuvo parsing lib
          return injectLibs;
        }
      );
    }
  }); // AvastWRC.bs.aos

  AvastWRC.bal.registerModule(AvastWRC.bs.SP);
}).call(this, _);

/*******************************************************************************
 *  avast! browsers extensions
 *  (c) 2012-2014 Avast Corp.
 *
 *  Background Browser Specific - AOS specific - module for stadalone execution
 *
 ******************************************************************************/

(function(AvastWRC, chrome, _) {

AvastWRC.bs.SP.sa = AvastWRC.bs.SP.sa || {};

  var EDITIONS_CONFIG = // same config for all editions
    { 
      extType: AvastWRC.EXT_TYPE_SP,
      callerId: 8020,
      reqUrlInfoServices: 0x0040, // SP only
       extVer: 15, dataVer: 15,
      safePrice : true, // SP module always enabled
      brandingType: AvastWRC.BRANDING_TYPE_AVAST
    };

  // id of linked AOS extension
  var _aos_id = null;


  _.extend(AvastWRC.bs.SP.sa, // Browser specific
  {
    /**
     * Function called on BAL initialization to initialize the module.
     */
    init: function (balInst) {
      chrome.runtime.onMessageExternal.addListener (
        function(request, sender, sendResponse) {
          switch(request.msg) {
            case 'init':
              if (request.sender_id) {
                _aos_id = request.sender_id;
              }
              sendResponse({});
              break;
            case 'close':
              if (request.sender_id === _aos_id) {
                _aos_id = null;
              }
              break;
            default:

          }
        }
      );

      // Obtain userId
      var settings = balInst.settings.get();
      var userid = settings.current.userId;
      if (!userid || userid.length <= 0 ) {
        AvastWRC.Query.getServerUserId(function(userid) {
          balInst.storeUserId(userid);
        });
      }
    },

    sendMessage : function(msg) {
      if (_aos_id) {
        chrome.runtime.sendMessage(_aos_id, msg);
      }
    },

    /* Register SP Standalone Event handlers */
    registerModuleListeners: function(ee) {
      /* Pass request to set domain trackable */
      ee.on('message.setDomainTrackable', function(e) {
        if (_aos_id) { // pass to AOS
          chrome.runtime.sendMessage(_aos_id, {msg: 'event', event: 'message.setDomainTrackable', host: e.host });
        }
      });
    }

  }); // AvastWRC.bs.SP.sa

  AvastWRC.bal.registerModule(AvastWRC.bs.SP.sa);

  AvastWRC.init(EDITIONS_CONFIG.callerId); // initialize the avastwrc modules
  // Start background page initilizing BAL core
  AvastWRC.bal.init('Chrome', AvastWRC.bs, localStorage, EDITIONS_CONFIG);

}).call(this, AvastWRC, chrome, _);

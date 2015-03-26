/*
* adapt-pageIncompletePrompt
* License - https://github.com/cgkineo/adapt_framework/blob/master/LICENSE
* Maintainers - Thomas Taylor <thomas.taylor@kineo.com>
*/
define(function(require) {
	var Adapt = require("coreJS/adapt");
	var PLUGIN_NAME = "_pageIncompletePrompt";
	var model;

	var isEnabled = function() {
		var pageModel = Adapt.findById(Adapt.location._currentId);
		var isEnabledForCourse = model && !!model._isEnabled;
        var isEnabledForPage = pageModel.get("_pageIncompletePrompt") && !!pageModel.get("_pageIncompletePrompt")._isEnabled;        		
		return (isEnabledForCourse && isEnabledForPage !== false) || isEnabledForPage;
	};
	
	var allComponentsComplete = function() {
		var pageModel = Adapt.findById(Adapt.location._currentId);
		var pageComponents = pageModel.findDescendants("components").where({"_isAvailable": true});
		var allComplete = true;
		
		_.each(pageComponents, function(component) {
			var hasPageProgress = component.get("_pageLevelProgress") && component.get("_pageLevelProgress")._isEnabled;
			var isComplete = component.get("_isComplete");
			if(hasPageProgress && !isComplete) allComplete = false;
		});
		
		return allComplete;
	};
	
	var enableRouterNav = function(value) {
		Adapt.router.set("_canNavigate", value,{ pluginName: PLUGIN_NAME });
	};
	
        var handleNav = function(event) {
                if(!allComponentsComplete()) { 
                        var promptObject = {
                                title: model.title,
                                body: model.message,
                                _prompts:[{
                                        promptText: model._buttons.yes,
                                        _callbackEvent: "pageIncompletePrompt:" + event,
                                },{
                                        promptText: model._buttons.no,
                                        _callbackEvent: ""
                                }],
                                _showIcon: true
                        }
                        Adapt.trigger("notify:prompt", promptObject);
                }
                else enableRouterNav(true);
        };	
	/**
	* Adapt events
	*/
	
	Adapt.on("app:dataLoaded", function() {
		model = Adapt.course.get(PLUGIN_NAME);
	});
	
	Adapt.on("router:page", function(pageView) {
		if(isEnabled()) enableRouterNav(false);
	});
	
	Adapt.on("pageIncompletePrompt:leavePage", function() {
		enableRouterNav(true);
		Adapt.trigger("navigation:backButton");
	});
       
        Adapt.on("navigation:backButton", function() {
                handleNav("backButton");
        });
        Adapt.on("navigation:menuButton", function() {
                handleNav("menuButton");
        });
       
        Adapt.on("pageIncompletePrompt:backButton", function() {
                enableRouterNav(true);
                Adapt.trigger("navigation:backButton");
        });
        Adapt.on("pageIncompletePrompt:menuButton", function() {
                enableRouterNav(true);
                Adapt.trigger("navigation:menuButton");
        });	
});
